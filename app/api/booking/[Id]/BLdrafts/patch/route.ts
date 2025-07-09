// File: app/api/bookings/[bookingId]/bl-drafts/[draftNo]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

// Only these fields can be patched
const PatchBLSchema = z.object({
  portOfLoading:   z.string().length(5).optional(),
  portOfDischarge: z.string().length(5).optional(),
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

  // 1) Parse & validate payload
  let updates: PatchBLInput;
  try {
    updates = PatchBLSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 2) Load existing B/L draft + cut-off + quotationId
  const existing = await prismaClient.bLDraft.findUnique({
    where: { documentNo: draftNo },
    select: {
      documentNo:      true,
      bookingId:       true,
      portOfLoading:   true,
      portOfDischarge: true,
      booking: {
        select: {
          blCutOffAt:  true,
          quotationId: true
        }
      }
    }
  });
  if (!existing || existing.bookingId !== bookingId) {
    return NextResponse.json({ error: "B/L draft not found" }, { status: 404 });
  }

  // 2a) Guard against null ports
  if (existing.portOfLoading == null || existing.portOfDischarge == null) {
    return NextResponse.json(
      { error: "Existing B/L draft missing portOfLoading or portOfDischarge" },
      { status: 500 }
    );
  }

  // 3) Determine old vs new ports (safe to trim/compare now)
  const oldPOL = existing.portOfLoading;
  const oldPOD = existing.portOfDischarge;
  const newPOL = updates.portOfLoading
    ? updates.portOfLoading.trim().toUpperCase()
    : oldPOL;
  const newPOD = updates.portOfDischarge
    ? updates.portOfDischarge.trim().toUpperCase()
    : oldPOD;
  const polChanged = newPOL !== oldPOL;
  const podChanged = newPOD !== oldPOD;

  // 4) Enforce cut-off
  const now    = new Date();
  const cutoff = existing.booking.blCutOffAt;
  if (cutoff && now > cutoff) {
    return NextResponse.json({ error: "B/L amendment cut-off has passed" }, { status: 403 });
  }

  // 5) Perform patch + invoice adjustments in a transaction
  const updated = await prismaClient.$transaction(async tx => {
    // a) Snapshot before edit
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.documentNo,
        snapshot:    existing,
        createdById: null
      }
    });

    // b) Apply the port changes
    const patched = await tx.bLDraft.update({
      where: { documentNo: draftNo },
      data: {
        portOfLoading:   newPOL,
        portOfDischarge: newPOD
      }
    });

    // c) If the route changed, rebuild freight & surcharge lines
    if (polChanged || podChanged) {
      // 1) Load the invoice
      const inv = await tx.invoice.findFirstOrThrow({ where: { bookingId } });

      // 2) Delete old freight & surcharge lines
      await tx.invoiceLine.deleteMany({
        where: {
          invoiceId: inv.id,
          reference: { in: ["BASE_FREIGHT", "SURCHARGE"] }
        }
      });

      // 3) Get booking containers
      const bookingRec = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { containers: true }
      });
      if (!bookingRec) throw new Error("Booking not found");

      // 4) Find the correct quotation route
      const route = await tx.quotationRouting.findFirstOrThrow({
        where: {
          quotationId: bookingRec.quotationId,
          pol:         newPOL,
          pod:         newPOD
        }
      });
      const { serviceCode, commodity } = route;

      // 5) For each container type on the booking
      for (const bc of bookingRec.containers) {
        const qty  = bc.qty;
        const type = bc.type; // e.g. "20GP"

        // a) Fetch TEU factor & group
        const ct = await tx.containerType.findUniqueOrThrow({
          where: { isoCode: type },
          select: { teuFactor: true, group: true }
        });

        // b) Look up the live Tariff
        const tariff = await tx.tariff.findFirstOrThrow({
          where: {
            serviceCode,
            pol:        newPOL,
            pod:        newPOD,
            commodity,
            group:      ct.group,
            validFrom: { lte: now },
            OR: [
              { validTo: null },
              { validTo: { gte: now } }
            ]
          },
          select: { ratePerTeu: true }
        });

        // c) Insert base freight line
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

        // d) Fetch & insert FREIGHT‐scope surcharges
        const rates = await tx.surchargeRate.findMany({
          where: { containerTypeIsoCode: type },
          include: { surchargeDef: true }
        });
        for (const r of rates) {
          const def = r.surchargeDef;
          if (
            def.scope === "FREIGHT" &&
            (!def.serviceCode || def.serviceCode === serviceCode)
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

      // e) If we’re past cut-off, add the amendment fee once
      if (cutoff && now > cutoff) {
        const exists = await tx.invoiceLine.findFirst({
          where: { invoiceId: inv.id, reference: "AMEND_FEE" }
        });
        if (!exists) {
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

      // f) Re‐aggregate invoice total
      const agg = await tx.invoiceLine.aggregate({
        where: { invoiceId: inv.id },
        _sum:  { amount: true }
      });
      await tx.invoice.update({
        where: { id: inv.id },
        data:  { totalAmount: agg._sum.amount! }
      });
    }

    // d) Snapshot after edit
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.documentNo,
        snapshot:    patched,
        createdById: null
      }
    });

    return patched;
  });

  return NextResponse.json(updated, { status: 200 });
}
