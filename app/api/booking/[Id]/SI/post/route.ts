// File: app/api/bookings/[bookingId]/si/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { DeclarationStatus, DeclarationType } from "@prisma/client";

// --- Zod schemas for nested containers & cargo ---
const CargoSchema = z.object({
  hsCode:       z.string().min(1),
  description:  z.string().min(1),
  grossWeight:  z.number().nonnegative().optional(),
  netWeight:    z.number().nonnegative().optional(),
  noOfPackages: z.number().int().nonnegative().optional(),
  isDangerous:  z.boolean().optional().default(false),
  unNumber:     z.string().optional().nullable(),
  imoClass:     z.string().optional().nullable(),
  packingGroup: z.string().optional().nullable(),
});

const ContainerSchema = z.object({
  containerNumber: z.string(),
  seals:           z.array(z.string()).optional().default([]),
  marksAndNumbers: z.string().optional(),
  hsCode:          z.string().optional(),
  cargo:           z.array(CargoSchema).min(1),
});

// --- Zod schema for full SI payload ---
const CreateSISchema = z.object({
  consignee:        z.string().min(1),
  placeOfReceipt:   z.string().min(1),
  portOfLoading:    z.string().min(1),
  portOfDischarge:  z.string().min(1),
  finalDestination: z.string().min(1),
  vesselName:       z.string().optional(),
  voyageNumber:     z.string().optional(),
  specialRemarks:   z.string().optional(),
  containers:       z.array(ContainerSchema).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId format
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Parse & validate the request body
  let data: z.infer<typeof CreateSISchema>;
  try {
    data = CreateSISchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // 3) Load booking + booked container types & quantities
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      containers: {
        select: {
          type: true,
          qty:  true
        }
      }
    }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const allowedTypes = new Set(booking.containers.map(bc => bc.type));

  // 4) Enforce total container count from booking
  const maxAllowed = booking.containers.reduce((sum, bc) => sum + bc.qty, 0);
  const requested = data.containers.length;
  if (requested > maxAllowed) {
    return NextResponse.json(
      { error: `You tried to add ${requested} containers, but the booking only has ${maxAllowed} booked.` },
      { status: 400 }
    );
  }

  // 5) Load CRO-released empties for this booking
  const croRows = await prismaClient.cROContainer.findMany({
    where: { cro: { bookingId } },
    select: {
      container: {
        select: {
          containerNo:           true,
          containerTypeIsoCode:  true
        }
      }
    }
  });
  const allowedNumbers = new Set(croRows.map(r => r.container.containerNo));
  const typeByNumber = new Map<string,string>(
    croRows.map(r => [r.container.containerNo, r.container.containerTypeIsoCode])
  );

  // 6) Validate each incoming SI container
  for (const c of data.containers) {
    if (!allowedNumbers.has(c.containerNumber)) {
      return NextResponse.json(
        { error: `Container ${c.containerNumber} was not released in CRO.` },
        { status: 400 }
      );
    }
    const typ = typeByNumber.get(c.containerNumber)!;
    if (!allowedTypes.has(typ)) {
      return NextResponse.json(
        { error: `Container ${c.containerNumber} has type ${typ}, which was not in the original booking.` },
        { status: 400 }
      );
    }
  }

  // 7) Detect DG cargo
  const requiresDGDeclaration = data.containers.some(c =>
    c.cargo.some(line => line.isDangerous)
  );

  // 8) Create the SI with nested containers & cargo
  let si;
  try {
    si = await prismaClient.shippingInstruction.create({
      data: {
        bookingId,
        consignee: data.consignee,
        placeOfReceipt: data.placeOfReceipt,
        portOfLoading: data.portOfLoading,
        portOfDischarge: data.portOfDischarge,
        finalDestination: data.finalDestination,
        vesselName: data.vesselName,
        voyageNumber: data.voyageNumber,
        specialRemarks: data.specialRemarks,
        containers: {
          create: data.containers.map(c => ({
            containerNumber: c.containerNumber,
            seals:           c.seals,
            marksAndNumbers: c.marksAndNumbers,
            hsCode:          c.hsCode,
            cargo: {
              create: c.cargo.map(line => ({
                hsCode:       line.hsCode,
                description:  line.description,
                grossWeight:  line.grossWeight,
                netWeight:    line.netWeight,
                noOfPackages: line.noOfPackages,
                isDangerous:  line.isDangerous,
                unNumber:     line.unNumber,
                imoClass:     line.imoClass,
                packingGroup: line.packingGroup,
              }))
            }
          }))
        }
      },
      include: {
        containers: { include: { cargoes: true } }
      }
    });
  } catch (err) {
    console.error("Error creating SI:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  // 9) Upsert a draft Invoice for this booking
  try {
    const defaultBank = await prismaClient.bankAccount.findFirst({ where: { isActive: true } });
    if (defaultBank) {
      await prismaClient.invoice.upsert({
        where: { bookingId },
        create: {
          bookingId:     booking.id,
          userId:        booking.userId,
          totalAmount:   0,
          dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status:        "PENDING",
          description:   `Draft invoice for booking ${booking.id}`,
          bankAccountId: defaultBank.id
        },
        update: {}
      });
    }
  } catch (e) {
    console.warn("Failed to upsert draft invoice:", e);
  }

  // 10) Append the SI Preparation Fee
  try {
    const siPrep = await prismaClient.surchargeRate.findFirst({
      where: { surchargeDef: { name: "SI Preparation Fee" } },
      select: { amount: true, surchargeDefId: true }
    });
    if (siPrep) {
      const invoice = await prismaClient.invoice.findUniqueOrThrow({ where: { bookingId } });
      await prismaClient.invoiceLine.create({
        data: {
          invoiceId:   invoice.id,
          description: "SI Preparation Fee",
          amount:      siPrep.amount,
          reference:   siPrep.surchargeDefId,
          glCode:      "6003-DOC",
          costCenter:  "Documentation",
        }
      });
      const agg = await prismaClient.invoiceLine.aggregate({
        where: { invoiceId: invoice.id },
        _sum:  { amount: true }
      });
      await prismaClient.invoice.update({
        where: { id: invoice.id },
        data:  { totalAmount: agg._sum.amount! }
      });
    }
  } catch (e) {
    console.warn("Skipping SI prep fee:", e);
  }

  // 11) Check for existing CUSTOMS declaration
  const customsDone = Boolean(
    await prismaClient.declaration.findFirst({
      where: {
        shippingInstructionId: si.id,
        declarationType:       DeclarationType.CUSTOMS,
        status:                DeclarationStatus.APPROVED
      },
      select: { id: true }
    })
  );

  // 12) Return the SI plus workflow flags
  return NextResponse.json(
    {
      shippingInstruction:        si,
      requiresCustomsDeclaration: !customsDone,
      requiresDGDeclaration,
    },
    { status: 201 }
  );
}
