// File: app/api/bookings/[bookingId]/si/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";

// --- Zod schema for allowed SI fields to patch ---
const PatchSISchema = z.object({
  consignee:        z.string().min(1).optional(),
  notifyParty:      z.string().optional(),
  vesselName:       z.string().optional(),
  voyageNumber:     z.string().optional(),
  placeOfReceipt:   z.string().optional(),
  portOfLoading:    z.string().optional(),
  portOfDischarge:  z.string().optional(),
  finalDestination: z.string().optional(),
  specialRemarks:   z.string().optional(),
});
type PatchSIInput = z.infer<typeof PatchSISchema>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId format
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Parse & validate request body
  let updates: PatchSIInput;
  try {
    updates = PatchSISchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 3) Load existing SI with children for snapshot
  const existingSI = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    include: {
      containers:  { include: { cargoes: true } },
      packingLists: true,
      documents:    true,
    }
  });
  if (!existingSI) {
    return NextResponse.json({ error: "Shipping Instruction not found" }, { status: 404 });
  }

  // 4) Transaction: pre-edit snapshot → apply update → post-edit snapshot
  let beforeVersion, afterVersion;
  let updatedSI!: typeof existingSI;  // non-null assertion

  await prismaClient.$transaction(async (tx) => {
    // A) pre-edit
    beforeVersion = await tx.sIVersion.create({
      data: {
        shippingInstructionId: existingSI.id,
        data: JSON.parse(JSON.stringify(existingSI)),
        note: "pre-edit snapshot",
      }
    });

    // B) apply updates
    updatedSI = await tx.shippingInstruction.update({
      where: { id: existingSI.id },
      data: updates,
      include: {
        containers:  { include: { cargoes: true } },
        packingLists: true,
        documents:    true,
      }
    });

    // C) post-edit
    afterVersion = await tx.sIVersion.create({
      data: {
        shippingInstructionId: updatedSI.id,
        data: JSON.parse(JSON.stringify(updatedSI)),
        note: "post-edit snapshot",
      }
    });
  });

  // 5) Compute declaration flags on updatedSI
  const hasDG = updatedSI.containers.some(c =>
    c.cargoes.some(line => line.isDangerous)
  );
  const dgDone = !!(
    await prismaClient.declaration.findFirst({
      where: {
        shippingInstructionId: updatedSI.id,
        declarationType:       "DG",
        status:                "COMPLETED",
      },
      select: { id: true }
    })
  );
  const customsDone = !!(
    await prismaClient.declaration.findFirst({
      where: {
        shippingInstructionId: updatedSI.id,
        declarationType:       "CUSTOMS",
        status:                "COMPLETED",
      },
      select: { id: true }
    })
  );

  // 6) Return snapshots, updated SI, and flags
  return NextResponse.json({
    beforeVersion,
    afterVersion,
    shippingInstruction:        updatedSI,
    requiresCustomsDeclaration: !customsDone,
    requiresDGDeclaration:      hasDG && !dgDone,
  }, { status: 200 });
}
