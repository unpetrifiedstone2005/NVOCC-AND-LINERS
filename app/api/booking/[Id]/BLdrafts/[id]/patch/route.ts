// File: app/api/bookings/[bookingId]/bl-drafts/[draftNo]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { DraftStatus }              from "@prisma/client";

const PatchBLSchema = z.object({
  portOfLoading:   z.string().length(5).optional(),   // UN/LOCODE
  portOfDischarge: z.string().length(5).optional(),   // UN/LOCODE
  status:          z.nativeEnum(DraftStatus).optional()
});
type PatchBLInput = z.infer<typeof PatchBLSchema>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string; draftNo: string } }
) {
  const { bookingId, draftNo } = params;
  const uuidRE = /^[0-9a-fA-F\-]{36}$/;
  if (!uuidRE.test(bookingId) || !uuidRE.test(draftNo)) {
    return NextResponse.json({ error: "Invalid bookingId or draftNo" }, { status: 400 });
  }

  // 1) parse + validate
  let updates: PatchBLInput;
  try {
    updates = PatchBLSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 2) load existing draft by documentNo (business key), get its internal id + cut‐off
  const existing = await prismaClient.bLDraft.findFirst({
    where: { documentNo: draftNo },
    select: {
      id:               true,
      documentNo:       true,
      bookingId:        true,
      portOfLoading:    true,
      portOfDischarge:  true,
      status:           true,
      booking: { select: { blCutOffAt: true } }
    }
  });
  if (!existing || existing.bookingId !== bookingId) {
    return NextResponse.json({ error: "B/L draft not found" }, { status: 404 });
  }

  // 3) forbid changes once “final”
  if (
    existing.status === DraftStatus.APPROVED ||
    existing.status === DraftStatus.RELEASED
  ) {
    return NextResponse.json(
      { error: "This draft is finalized and cannot be amended" },
      { status: 403 }
    );
  }

  // 4) enforce cut-off
  const now = new Date();
  if (existing.booking.blCutOffAt && now > existing.booking.blCutOffAt) {
    return NextResponse.json(
      { error: "B/L amendment cut-off has passed" },
      { status: 403 }
    );
  }

  // 5) normalize ports
  const oldPOL = existing.portOfLoading!;
  const oldPOD = existing.portOfDischarge!;
  const newPOL = updates.portOfLoading
    ? updates.portOfLoading.trim().toUpperCase()
    : oldPOL;
  const newPOD = updates.portOfDischarge
    ? updates.portOfDischarge.trim().toUpperCase()
    : oldPOD;

  // 6) transaction: snapshot → patch → snapshot
  const updated = await prismaClient.$transaction(async tx => {
    // a) pre-edit snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.id,
        snapshot:    existing,
        createdById: null
      }
    });

    // b) apply the patch (ports and/or status)
    const data: Partial<{
      portOfLoading:   string;
      portOfDischarge: string;
      status:          DraftStatus;
    }> = {
      portOfLoading:   newPOL,
      portOfDischarge: newPOD
    };
    if (updates.status !== undefined) {
      data.status = updates.status;
    }
    const patched = await tx.bLDraft.update({
      where: { id: existing.id },
      data
    });

    // c) post-edit snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     patched.id,
        snapshot:    patched,
        createdById: null
      }
    });

    return patched;
  });

  return NextResponse.json(updated, { status: 200 });
}
