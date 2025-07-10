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
  marksAndNumbers: z.string().optional().nullable(),
  hsCode:          z.string().optional().nullable(),
  cargo:           z.array(CargoSchema).min(1),
});

// --- Zod schemas for packing‐list support ---
const PackingListItemSchema = z.object({
  hsCode:          z.string().min(1),
  description:     z.string().min(1),
  quantity:        z.number().int().nonnegative(),
  netWeight:       z.number().nonnegative().optional(),
  grossWeight:     z.number().nonnegative().optional(),
  marksAndNumbers: z.string().optional().nullable(),
});

const PackingListSchema = z.object({
  items: z.array(PackingListItemSchema).min(1)
});

// --- Zod schema for full SI payload, now with optional packingLists ---
const CreateSISchema = z.object({
  consignee:        z.string().min(1),
  placeOfReceipt:   z.string().min(1),
  portOfLoading:    z.string().min(1),
  portOfDischarge:  z.string().min(1),
  finalDestination: z.string().min(1),
  vesselName:       z.string().optional().nullable(),
  voyageNumber:     z.string().optional().nullable(),
  specialRemarks:   z.string().optional().nullable(),
  containers:       z.array(ContainerSchema).min(1),
  packingLists:     z.array(PackingListSchema).optional()
});
type CreateSIInput = z.infer<typeof CreateSISchema>;

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
  let data: CreateSIInput;
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
        select: { type: true, qty: true }
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

  // 5) Load CRO‐released empties for this booking
  const croRows = await prismaClient.cROContainer.findMany({
    where: { cro: { bookingId } },
    select: {
      container: {
        select: {
          containerNo:          true,
          containerTypeIsoCode: true
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

  // 7) Detect if any DG cargo present
  const requiresDGDeclaration = data.containers.some(c =>
    c.cargo.some(line => line.isDangerous)
  );

  // 8) Create the SI with nested containers & cargo
  const si = await prismaClient.shippingInstruction.create({
    data: {
      bookingId,
      consignee:        data.consignee,
      placeOfReceipt:   data.placeOfReceipt,
      portOfLoading:    data.portOfLoading,
      portOfDischarge:  data.portOfDischarge,
      finalDestination: data.finalDestination,
      vesselName:       data.vesselName,
      voyageNumber:     data.voyageNumber,
      specialRemarks:   data.specialRemarks,
      containers: {
        create: data.containers.map(c => ({
          containerNumber: c.containerNumber,
          seals:           c.seals,
          marksAndNumbers: c.marksAndNumbers,
          hsCode:          c.hsCode,
          cargoes: {
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

  // 8a) Create packing‐list records if provided
  if (data.packingLists) {
    for (const pl of data.packingLists) {
      await prismaClient.packingList.create({
        data: {
          shippingInstructionId: si.id,
          items: {
            create: pl.items.map(item => ({
              hsCode:          item.hsCode,
              description:     item.description,
              quantity:        item.quantity,
              netWeight:       item.netWeight,
              grossWeight:     item.grossWeight,
              marksAndNumbers: item.marksAndNumbers,
            }))
          }
        }
      });
    }
  }

  // --- NOW: invoice the SI Preparation Fee on EXPORT leg ---

  // 9) Find or create the EXPORT‐leg invoice
  let exportInvoice = await prismaClient.invoice.findFirst({
    where: { bookingId, leg: "EXPORT" }
  });
  if (!exportInvoice) {
    const defaultBank = await prismaClient.bankAccount.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    exportInvoice = await prismaClient.invoice.create({
      data: {
        userId:        booking.userId,
        bookingId,
        leg:           "EXPORT",
        totalAmount:   0,
        issuedDate:    new Date(),
        dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status:        "PENDING",
        description:   "Export invoice",
        bankAccountId: defaultBank?.id!
      }
    });
  }

  // 10) Add the SI Preparation Fee line
  try {
    const siPrep = await prismaClient.surchargeRate.findFirst({
      where: { surchargeDef: { name: "SI Preparation Fee" } },
      select: { amount: true, surchargeDefId: true }
    });
    if (siPrep) {
      await prismaClient.invoiceLine.create({
        data: {
          invoiceId:   exportInvoice.id,
          description: "SI Preparation Fee",
          amount:      siPrep.amount,
          reference:   siPrep.surchargeDefId,
          glCode:      "6003-DOC",
          costCenter:  "Documentation"
        }
      });
    }
  } catch {
    // skip if missing
  }

  // 11) Re‐aggregate totalAmount from export‐leg lines
  const agg = await prismaClient.invoiceLine.aggregate({
    where: { invoiceId: exportInvoice.id },
    _sum:  { amount: true }
  });
  await prismaClient.invoice.update({
    where: { id: exportInvoice.id },
    data:  { totalAmount: agg._sum.amount ?? 0 }
  });

  // 12) Check for existing CUSTOMS declaration
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

  // 13) Return SI + workflow flags + exportInvoice
  return NextResponse.json(
    {
      shippingInstruction:        si,
      requiresCustomsDeclaration: !customsDone,
      requiresDGDeclaration,
      exportInvoice:              await prismaClient.invoice.findUnique({
        where: { id: exportInvoice.id },
        include: { lines: true }
      })
    },
    { status: 201 }
  );
}
