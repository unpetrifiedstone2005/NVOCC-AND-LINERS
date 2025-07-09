// File: app/api/bookings/[bookingId]/bl-drafts/auto/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient }            from "@/app/lib/db";
import { v4 as uuidv4 }            from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;
  const uuidRE = /^[0-9a-fA-F\-]{36}$/;
  if (!uuidRE.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 1) Load booking.userId + quotationId
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, quotationId: true }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 2) Load latest SI, including the fields we need
  const si = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    include: {
      containers: {
        select: {
          containerNumber:  true,
          seals:            true,
          marksAndNumbers:  true,
          cargoes: {
            select: {
              description:  true,
              hsCode:       true,
              grossWeight:  true,
              netWeight:    true,
              noOfPackages: true,
              isDangerous:  true,
              unNumber:     true,
              imoClass:     true,
              packingGroup: true
            }
          }
        }
      }
    }
  });
  if (!si) {
    return NextResponse.json({ error: "Shipping Instruction not found" }, { status: 404 });
  }

  // 3) Build nested create data for B/L containers & cargo
  const containerCreates = si.containers.map(c => ({
    containerNumber:    c.containerNumber!,
    sealNumber:         c.seals.join(","),
    sizeType:           null,
    kindOfPackages:     c.marksAndNumbers,
    noOfPackages:       null,
    descriptionOfGoods: null,
    netWeightKg:        null,
    grossWeightKg:      null,
    measurementsM3:     null,
    cargoes: {
      create: c.cargoes.map(cg => ({
        description:           cg.description,
        hsCode:                cg.hsCode,
        grossWeight:           cg.grossWeight !== null ? cg.grossWeight.toNumber() : null,
        netWeight:             cg.netWeight   !== null ? cg.netWeight.toNumber()   : null,
        noOfPackages:          cg.noOfPackages ?? null,
        marksAndNumbers:       null,
        outerPacking:          null,
        sealNo:                null,
        sealNoOptional:        null,
        customerLoadReference: null,
        isDangerous:           cg.isDangerous,
        unNumber:              cg.unNumber,
        imoClass:              cg.imoClass,
        packingGroup:          cg.packingGroup
      }))
    }
  }));

  // 4) Create the B/L draft
  const draft = await prismaClient.bLDraft.create({
    data: {
      documentNo:  uuidv4(),
      documentId:  uuidv4(),
      UserId:      booking.userId,
      bookingId,

      shipper:               si.consignee,
      consignee:             si.consignee,
      notifyParty:           si.notifyParty ?? undefined,
      additionalNotifyParty: si.notifyParty ?? undefined,
      placeOfReceipt:        si.placeOfReceipt ?? undefined,
      portOfLoading:         si.portOfLoading,
      portOfDischarge:       si.portOfDischarge,
      finalDestination:      si.finalDestination ?? undefined,
      vesselOrAircraft:      si.vesselName ?? undefined,
      voyageNo:              si.voyageNumber ?? undefined,
      remarksToCarrier:      si.specialRemarks ?? undefined,

      placeOfIssue:   "AUTO-GENERATED",
      dateOfIssue:    new Date(),

      containers: {
        create: containerCreates
      }
    },
    include: {
      containers: { include: { cargoes: true } }
    }
  });

  // 5) Find default bank account
  const defaultBank = await prismaClient.bankAccount.findFirst({
    where: { isActive: true },
    select: { id: true }
  });

  // 6) Upsert draft invoice with bankAccountId
  let invoice = await prismaClient.invoice.upsert({
    where: { bookingId },
    create: {
      bookingId,
      userId:        booking.userId,
      bankAccountId: defaultBank?.id!,
      totalAmount:   0,
      dueDate:       new Date(Date.now() + 30*24*60*60*1000),
      status:        "PENDING",
      description:   `Draft invoice for BL ${draft.documentNo}`,
    },
    update: {}
  });

  // 7) Copy only relevant quotation lines into invoice lines
  // a) get moved container numbers from the draft
  const movedContainerNos = draft.containers.map(c => c.containerNumber!);

  // b) lookup their master records to get container types
  const containers = await prismaClient.container.findMany({
    where: { containerNo: { in: movedContainerNos } },
    select: { containerTypeIsoCode: true }
  });
  const movedTypes = Array.from(new Set(containers.map(c => c.containerTypeIsoCode)));

  // c) fetch all quotation lines
  const allQuoteLines = await prismaClient.quotationLine.findMany({
    where: { quotationId: booking.quotationId }
  });
  // d) filter to only those whose description mentions a moved type
  const relevant = allQuoteLines.filter(ql =>
    movedTypes.some(type => ql.description.includes(type))
  );
  // e) insert those into invoice
  if (relevant.length) {
    await prismaClient.invoiceLine.createMany({
      data: relevant.map(q => ({
        invoiceId:  invoice.id,
        description:q.description,
        amount:     q.amount.toNumber(),
        reference:  q.reference,
        glCode:     q.glCode,
        costCenter: q.costCenter
      }))
    });
    // re-sum invoice
    const agg1 = await prismaClient.invoiceLine.aggregate({
      where: { invoiceId: invoice.id },
      _sum:  { amount: true }
    });
    invoice = await prismaClient.invoice.update({
      where: { id: invoice.id },
      data:  { totalAmount: agg1._sum.amount! }
    });
  }

  // 8) Append B/L Generation Fee
  const feeRate = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "B/L Generation Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (feeRate) {
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:  invoice.id,
        description:"B/L Generation Fee",
        amount:     feeRate.amount,
        reference:  feeRate.surchargeDefId,
        glCode:     "6003-DOC",
        costCenter: "Documentation"
      }
    });
    // re-sum invoice total
    const agg2 = await prismaClient.invoiceLine.aggregate({
      where: { invoiceId: invoice.id },
      _sum:  { amount: true }
    });
    invoice = await prismaClient.invoice.update({
      where: { id: invoice.id },
      data:  { totalAmount: agg2._sum.amount! }
    });
  }

  // 9) Return draft & invoice total
  return NextResponse.json(
    { draft, invoiceTotal: invoice.totalAmount },
    { status: 201 }
  );
}