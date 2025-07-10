// File: app/api/bookings/[bookingId]/bl-drafts/[draftNo]/approve/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient }             from "@/app/lib/db";
import { DraftStatus }              from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string; draftNo: string } }
) {
  const { bookingId, draftNo } = params;
  const uuidRE = /^[0-9a-fA-F\-]{36}$/;
  if (!uuidRE.test(bookingId) || !uuidRE.test(draftNo)) {
    return NextResponse.json({ error: "Invalid bookingId or draftNo" }, { status: 400 });
  }

  // 1) Load draft by business key (documentNo) to get its internal `id`
  const existing = await prismaClient.bLDraft.findFirst({
    where: { documentNo: draftNo, bookingId },
    select: {
      id:               true,
      documentNo:       true,
      bookingId:        true,
      status:           true,
      portOfLoading:    true,
      portOfDischarge:  true,
      booking: {
        select: {
          blCutOffAt:   true,
          quotationId:  true,
          containers:   true,
          userId:       true
        }
      }
    }
  });
  if (!existing) {
    return NextResponse.json({ error: "B/L draft not found" }, { status: 404 });
  }

  // 2) Prevent re-approval
  if (
    existing.status === DraftStatus.APPROVED ||
    existing.status === DraftStatus.RELEASED
  ) {
    return NextResponse.json(
      { error: "This draft is already finalized." },
      { status: 403 }
    );
  }

  // 3) Enforce cut-off
  const now = new Date();
  if (existing.booking.blCutOffAt && now > existing.booking.blCutOffAt) {
    return NextResponse.json(
      { error: "B/L amendment cut-off has passed" },
      { status: 403 }
    );
  }

  // 4) Transaction: snapshot → approve → invoice recalcs → snapshot
  const finalDraft = await prismaClient.$transaction(async tx => {
    // a) pre-approval snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.id,
        snapshot:    existing,
        createdById: null
      }
    });

    // b) mark APPROVED
    await tx.bLDraft.update({
      where: { id: existing.id },
      data:  { status: DraftStatus.APPROVED }
    });

    // c) invoice recalculation on EXPORT leg
    const inv = await tx.invoice.findFirstOrThrow({
      where: { bookingId, leg: "EXPORT" }
    });

    // remove old freight & surcharge lines
    await tx.invoiceLine.deleteMany({
      where: {
        invoiceId: inv.id,
        reference: { in: ["BASE_FREIGHT", "SURCHARGE"] }
      }
    });

    // fetch route & containers
    const { quotationId, containers } = existing.booking;
    const route = await tx.quotationRouting.findFirstOrThrow({
      where: {
        quotationId,
        pol: existing.portOfLoading!,
        pod: existing.portOfDischarge!
      }
    });

    // rebuild base freight & FREIGHT-scope surcharges
    for (const bc of containers) {
      const qty  = bc.qty;
      const type = bc.type;
      const ct   = await tx.containerType.findUniqueOrThrow({
        where: { isoCode: type },
        select: { teuFactor: true, group: true }
      });

      const tariff = await tx.tariff.findFirstOrThrow({
        where: {
          serviceCode: route.serviceCode,
          pol:         existing.portOfLoading!,
          pod:         existing.portOfDischarge!,
          commodity:   route.commodity,
          group:       ct.group,
          validFrom:   { lte: now },
          OR: [
            { validTo: null },
            { validTo: { gte: now } }
          ]
        },
        select: { ratePerTeu: true }
      });

      // base freight line
      const baseAmt = tariff.ratePerTeu.toNumber() * ct.teuFactor * qty;
      await tx.invoiceLine.create({
        data: {
          invoiceId:  inv.id,
          description:`${qty}×${type} base freight`,
          amount:     baseAmt,
          reference:  "BASE_FREIGHT",
          glCode:     "4001-FRT",
          costCenter: "Freight"
        }
      });

      // FREIGHT-scope surcharge lines
      const rates = await tx.surchargeRate.findMany({
        where: { containerTypeIsoCode: type },
        include: { surchargeDef: true }
      });
      for (const r of rates) {
        const def = r.surchargeDef;
        if (
          def.scope === "FREIGHT" &&
          (!def.serviceCode || def.serviceCode === route.serviceCode)
        ) {
          const amt = r.amount.toNumber() * qty;
          await tx.invoiceLine.create({
            data: {
              invoiceId:  inv.id,
              description:`${def.name} (${qty}×${type})`,
              amount:     amt,
              reference:  r.surchargeDefId,
              glCode:     "4002-SUR",
              costCenter: "Surcharge"
            }
          });
        }
      }
    }

    // d) cut-off amendment fee if needed
    if (existing.booking.blCutOffAt && now > existing.booking.blCutOffAt) {
      const hasFee = await tx.invoiceLine.findFirst({
        where: { invoiceId: inv.id, reference: "AMEND_FEE" }
      });
      if (!hasFee) {
        const feeRate = await tx.surchargeRate.findFirstOrThrow({
          where: { surchargeDef: { name: "B/L Cut-off Amendment Fee" } },
          select: { amount: true, surchargeDefId: true }
        });
        await tx.invoiceLine.create({
          data: {
            invoiceId:  inv.id,
            description:"B/L Cut-off Amendment Fee",
            amount:     feeRate.amount.toNumber(),
            reference:  feeRate.surchargeDefId,
            glCode:     "6003-DOC",
            costCenter: "Documentation"
          }
        });
      }
    }

    // e) recompute total
    const agg = await tx.invoiceLine.aggregate({
      where: { invoiceId: inv.id },
      _sum:  { amount: true }
    });
    await tx.invoice.update({
      where: { id: inv.id },
      data:  { totalAmount: agg._sum.amount! }
    });

    // f) post-approval snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.id,
        snapshot:    { ...existing, status: DraftStatus.APPROVED },
        createdById: null
      }
    });

    // return the approved draft
    return tx.bLDraft.findUniqueOrThrow({ where: { id: existing.id } });
  });

  return NextResponse.json(finalDraft, { status: 200 });
}
