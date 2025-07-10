// File: app/api/bookings/[bookingId]/bl-drafts/[draftNo]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { DraftStatus }              from "@prisma/client";

// Zod schema for PATCH payload
const PatchBLSchema = z.object({
  portOfLoading:   z.string().length(5).optional(),   // UN/LOCODE
  portOfDischarge: z.string().length(5).optional(),   // UN/LOCODE
  status:          z.nativeEnum(DraftStatus).optional(),
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

  // 1) Validate body
  let updates: PatchBLInput;
  try {
    updates = PatchBLSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 2) Load existing draft + its booking info
  const existing = await prismaClient.bLDraft.findFirst({
    where: { documentNo: draftNo },
    select: {
      id:               true,
      bookingId:        true,
      portOfLoading:    true,
      portOfDischarge:  true,
      status:           true,
      booking:          { select: { blCutOffAt: true, userId: true } }
    }
  });
  if (!existing || existing.bookingId !== bookingId) {
    return NextResponse.json({ error: "B/L draft not found" }, { status: 404 });
  }

  // 3) Forbid changes once final
  if (
    existing.status === DraftStatus.APPROVED ||
    existing.status === DraftStatus.RELEASED
  ) {
    return NextResponse.json(
      { error: "This draft is finalized and cannot be amended" },
      { status: 403 }
    );
  }

  // 4) Enforce cut-off
  const now = new Date();
  if (existing.booking.blCutOffAt && now > existing.booking.blCutOffAt) {
    return NextResponse.json(
      { error: "B/L amendment cut-off has passed" },
      { status: 403 }
    );
  }

  // 5) Normalize new port values
  const newPOL = updates.portOfLoading
    ? updates.portOfLoading.trim().toUpperCase()
    : existing.portOfLoading!;
  const newPOD = updates.portOfDischarge
    ? updates.portOfDischarge.trim().toUpperCase()
    : existing.portOfDischarge!;

  // 6) Transaction: snapshot → patch → snapshot
  const patched = await prismaClient.$transaction(async tx => {
    // a) pre-edit snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.id,
        snapshot:    existing,
        createdById: null
      }
    });

    // b) apply updates
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

    const updatedDraft = await tx.bLDraft.update({
      where: { id: existing.id },
      data
    });

    // c) post-edit snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     updatedDraft.id,
        snapshot:    updatedDraft,
        createdById: null
      }
    });

    return updatedDraft;
  });

  // 7) Bill “B/L Amendment Fee” on the EXPORT invoice
  const feeRate = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "B/L Amendment Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (feeRate) {
    // find or create EXPORT invoice
    let exportInv = await prismaClient.invoice.findFirst({
      where: { bookingId, leg: "EXPORT" }
    });
    if (!exportInv) {
      const bank = await prismaClient.bankAccount.findFirst({
        where: { isActive: true }, select: { id: true }
      });
      exportInv = await prismaClient.invoice.create({
        data: {
          userId:        existing.booking.userId,
          bookingId,
          leg:           "EXPORT",
          totalAmount:   0,
          issuedDate:    new Date(),
          dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status:        "PENDING",
          description:   "Export invoice",
          bankAccountId: bank!.id
        }
      });
    }
    // append fee line
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:   exportInv.id,
        description: "B/L Amendment Fee",
        amount:      feeRate.amount,
        reference:   feeRate.surchargeDefId,
        glCode:      "6003-DOC",
        costCenter:  "Documentation"
      }
    });
    // re-aggregate total
    const agg = await prismaClient.invoiceLine.aggregate({
      where: { invoiceId: exportInv.id },
      _sum:  { amount: true }
    });
    await prismaClient.invoice.update({
      where: { id: exportInv.id },
      data:  { totalAmount: agg._sum.amount! }
    });
  }

  // 8) Return updated draft
  return NextResponse.json(patched, { status: 200 });
}
