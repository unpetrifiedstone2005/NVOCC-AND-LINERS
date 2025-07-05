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
  // add nested schemas here if you allow container/cargo edits
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

  // 2) Validate body
  let updates: PatchSIInput;
  try {
    updates = PatchSISchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 3) Fetch existing SI + its containers & cargo for snapshot
  const existingSI = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    include: {
      containers: {
        include: { cargoes: true }   // <-- use 'cargoes'
      },
      packingLists: true,
      documents:    true
    }
  });
  if (!existingSI) {
    return NextResponse.json({ error: "Shipping Instruction not found" }, { status: 404 });
  }

  // 4) In a transaction, snapshot pre-edit, apply updates, snapshot post-edit
  let beforeVersion, afterVersion, updatedSI;
  await prismaClient.$transaction(async (tx) => {
    // A) pre-edit snapshot
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
      data: updates
    });

    // C) re-fetch with children and post-edit snapshot
    const reloaded = await tx.shippingInstruction.findUnique({
      where: { id: existingSI.id },
      include: {
        containers:   { include: { cargoes: true } },
        packingLists: true,
        documents:    true
      }
    });
    afterVersion = await tx.sIVersion.create({
      data: {
        shippingInstructionId: existingSI.id,
        data: JSON.parse(JSON.stringify(reloaded)),
        note: "post-edit snapshot",
      }
    });
  });

  // 5) Return both snapshots and the updated SI
  return NextResponse.json({
    beforeVersion,
    afterVersion,
    shippingInstruction: updatedSI
  }, { status: 200 });
}
