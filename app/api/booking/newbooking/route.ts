// File: app/api/bookings/[bookingId]/si/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { getServerSession }         from "next-auth/next";
import { authOptions }              from "@/app/lib/auth"; 
import {
  DeclarationStatus,
  DeclarationType,
  InvoiceStatus,
  Leg
} from "@prisma/client";

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
  containerNumber: z.string().optional(),
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
type CreateSIInput = z.infer<typeof CreateSISchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
    
   const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
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

  // 3) Load booking to enforce container count and get userId
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    include: { containers: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 4) Enforce total container count
  const maxAllowed = booking.containers.reduce((sum, bc) => sum + bc.qty, 0);
  const requested  = data.containers.length;
  if (requested > maxAllowed) {
    return NextResponse.json(
      {
        error: `You tried to add ${requested} containers, but the booking only has ${maxAllowed} booked.`
      },
      { status: 400 }
    );
  }

  // 5) Detect DG cargo
  const requiresDGDeclaration = data.containers.some(c =>
    c.cargo.some(line => line.isDangerous)
  );

  // 6) Create the SI with nested containers & cargo
  let si;
  try {
    si = await prismaClient.shippingInstruction.create({
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
  } catch (err) {
    console.error("Error creating SI:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  // 7) Find or create EXPORT‐leg draft invoice
  const defaultBank = await prismaClient.bankAccount.findFirst({
    where: { isActive: true },
    select: { id: true }
  });

  const exportInvoice = await prismaClient.invoice.findFirst({
    where: { bookingId, leg: Leg.EXPORT }
  }) ?? await prismaClient.invoice.create({
    data: {
      bookingId,
      userId:        booking.userId,
      leg:           Leg.EXPORT,
      totalAmount:   0,
      issuedDate:    new Date(),
      dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status:        InvoiceStatus.PENDING,
      description:   `Export invoice for booking ${bookingId}`,
      bankAccountId: defaultBank?.id!
    }
  });

  // 8) Append SI Preparation Fee to EXPORT invoice
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
    const agg = await prismaClient.invoiceLine.aggregate({
      where: { invoiceId: exportInvoice.id },
      _sum:  { amount: true }
    });
    await prismaClient.invoice.update({
      where: { id: exportInvoice.id },
      data:  { totalAmount: agg._sum.amount! }
    });
  }

  // 9) Return SI + workflow flags
  return NextResponse.json(
    {
      shippingInstruction:        si,
      requiresCustomsDeclaration: !Boolean(await prismaClient.declaration.findFirst({
        where: {
          shippingInstructionId: si.id,
          declarationType:       DeclarationType.CUSTOMS,
          status:                DeclarationStatus.APPROVED
        }
      })),
      requiresDGDeclaration
    },
    { status: 201 }
  );
}
