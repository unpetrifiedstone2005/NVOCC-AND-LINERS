// File: app/api/bookings/[bookingId]/bl-drafts/[draftNo]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

// Allow only these fields to be patched
const PatchBLSchema = z.object({
  portOfLoading:   z.string().optional(),
  portOfDischarge: z.string().optional(),
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

  // 2) Load existing B/L draft + booking.cutOff + quotationId
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

  // Determine new vs old ports
  const oldPOL = existing.portOfLoading;
  const oldPOD = existing.portOfDischarge;
  const newPOL = updates.portOfLoading   ?? oldPOL;
  const newPOD = updates.portOfDischarge ?? oldPOD;
  if (!newPOL || !newPOD) {
    return NextResponse.json({ error: "Both portOfLoading and portOfDischarge must be set" }, { status: 400 });
  }
  const polChanged = newPOL !== oldPOL;
  const podChanged = newPOD !== oldPOD;

  // 3) Enforce cut-off
  const now    = new Date();
  const cutoff = existing.booking.blCutOffAt;
  if (cutoff && now > cutoff) {
    return NextResponse.json({ error: "B/L amendment cut-off has passed" }, { status: 403 });
  }

  // 4) Transaction: snapshot → patch → invoice adjustments → snapshot
  const updated = await prismaClient.$transaction(async tx => {
    // a) Pre-edit snapshot
    await tx.bLDraftVersion.create({
      data: {
        draftNo:     existing.documentNo,
        snapshot:    existing,
        createdById: null
      }
    });

    // b) Apply the patch
    const patched = await tx.bLDraft.update({
      where: { documentNo: draftNo },
      data: { portOfLoading: newPOL, portOfDischarge: newPOD }
    });

    // c) If route changed, rebuild freight & surcharge lines
    if (polChanged || podChanged) {
      // 1) Load the invoice
      const inv = await tx.invoice.findFirstOrThrow({ where: { bookingId } });

      // 2) Delete old freight/surcharge lines
      await tx.invoiceLine.deleteMany({
        where: {
          invoiceId: inv.id,
          reference: { in: ["BASE_FREIGHT", "SURCHARGE"] }
        }
      });

      // 3) Load booking containers
      const bookingRec = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { containers: true }
      });
      if (!bookingRec) throw new Error("Booking not found");

      // 4) Fetch the quotation routing to get serviceCode & commodity
      const route = await tx.quotationRouting.findFirstOrThrow({
        where: {
          quotationId: bookingRec.quotationId,
          pol:         newPOL,
          pod:         newPOD
        }
      });
      const { serviceCode, commodity } = route;

      // 5) For each container in booking
      for (const bc of bookingRec.containers) {
        const qty  = bc.qty;
        const type = bc.type;              // e.g. "20GP" or "40HC"

        // a) Fetch container TEU factor and group
        const containerType = await tx.containerType.findUniqueOrThrow({
          where: { isoCode: type },
          select: { teuFactor: true, group: true }
        });

        // b) Look up live Tariff
        const tariff = await tx.tariff.findFirstOrThrow({
          where: {
            serviceCode,
            pol:        newPOL,
            pod:        newPOD,
            commodity,
            group:      containerType.group,
            validFrom: { lte: now },
            OR: [
              { validTo: null },
              { validTo: { gte: now } }
            ]
          },
          select: { ratePerTeu: true }
        });

        // c) Insert base freight line
        const baseAmt = tariff.ratePerTeu.toNumber() * containerType.teuFactor * qty;
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

        // d) Fetch & insert surcharges for FREIGHT scope
        const rates = await tx.surchargeRate.findMany({
          where: { containerTypeIsoCode: type },
          include: { surchargeDef: true }
        });
        for (const r of rates) {
          if (
            r.surchargeDef.scope === "FREIGHT" &&
            (!r.surchargeDef.serviceCode || r.surchargeDef.serviceCode === serviceCode)
          ) {
            const amt = r.amount.toNumber() * qty;
            await tx.invoiceLine.create({
              data: {
                invoiceId:  inv.id,
                description:`${r.surchargeDef.name} (${qty}×${type})`,
                amount:     amt,
                reference:  r.surchargeDefId,
                glCode:     "4002-SUR",
                costCenter: "Surcharge"
              }
            });
          }
        }
      }

      // 6) Append one AMEND_FEE if past cut-off
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

      // 7) Re-aggregate invoice total
      const agg = await tx.invoiceLine.aggregate({
        where: { invoiceId: inv.id },
        _sum:  { amount: true }
      });
      await tx.invoice.update({
        where: { id: inv.id },
        data:  { totalAmount: agg._sum.amount! }
      });
    }

    // d) Post-edit snapshot
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
