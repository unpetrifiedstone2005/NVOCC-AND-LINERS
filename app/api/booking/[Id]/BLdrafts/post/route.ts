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

  // 1) Load booking with needed fields
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId:         true,
      quotationId:    true,
      pickupOption:   true,
      deliveryOption: true,
      departureDate:  true,
      via1:           true,
      via2:           true,
      remarks:        true,
      containers:     true
    }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 2) Load SI with containers & cargo
  const si = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    include: {
      containers: {
        select: {
          containerNumber: true,
          seals:           true,
          marksAndNumbers: true,
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

  // 3) Prepare nested container & cargo create data
  const containerCreates = si.containers.map(c => ({
    containerNumber:      c.containerNumber!,
    sealNumber:           c.seals.join(","),
    sizeType:             null,
    kindOfPackages:       c.marksAndNumbers,
    noOfPackages:         null,
    descriptionOfGoods:   null,
    netWeightKg:          null,
    grossWeightKg:        null,
    measurementsM3:       null,
    cargoes: {
      create: c.cargoes.map(cg => ({
        description:           cg.description,
        hsCode:                cg.hsCode,
        grossWeight:           cg.grossWeight?.toNumber() ?? null,
        netWeight:             cg.netWeight?.toNumber() ?? null,
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
      documentNo:             uuidv4(),
      documentId:             uuidv4(),
      UserId:                 booking.userId,
      bookingId,
      pickupType:             booking.pickupOption,
      deliveryType:           booking.deliveryOption,
      scheduleDate:           booking.departureDate,
      via1:                   booking.via1,
      via2:                   booking.via2,
      remarks:                booking.remarks,
      shipper:                si.consignee,
      consignee:              si.consignee,
      notifyParty:            si.notifyParty ?? undefined,
      additionalNotifyParty:  si.notifyParty ?? undefined,
      placeOfReceipt:         si.placeOfReceipt ?? undefined,
      portOfLoading:          si.portOfLoading,
      portOfDischarge:        si.portOfDischarge,
      finalDestination:       si.finalDestination ?? undefined,
      vesselOrAircraft:       si.vesselName ?? undefined,
      voyageNo:               si.voyageNumber ?? undefined,
      remarksToCarrier:       si.specialRemarks ?? undefined,
      placeOfIssue:           "AUTO-GENERATED",
      dateOfIssue:            new Date(),
      containers:             { create: containerCreates }
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

  // 6) Find or create the EXPORT‐leg invoice
  const exportInvoice = await prismaClient.invoice.findFirst({
    where: { bookingId, leg: "EXPORT" }
  }) ?? await prismaClient.invoice.create({
    data: {
      bookingId,
      userId:        booking.userId,
      leg:           "EXPORT",
      totalAmount:   0,
      issuedDate:    new Date(),
      dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status:        "PENDING",
      description:   `Draft invoice for BL ${draft.documentNo}`,
      bankAccountId: defaultBank?.id!
    }
  });

  // 7) Copy only **export‐leg** quotation lines into the EXPORT invoice
  const movedNos = draft.containers.map(c => c.containerNumber!);
  const typeRows = await prismaClient.container.findMany({
    where: { containerNo: { in: movedNos } },
    select: { containerTypeIsoCode: true }
  });
  const types = Array.from(new Set(typeRows.map(r => r.containerTypeIsoCode)));

  // fetch all quotation lines
  const allQuoteLines = await prismaClient.quotationLine.findMany({
    where: { quotationId: booking.quotationId }
  });

  // filter to only base freight and export surcharges
  const exportQuoteLines = allQuoteLines.filter(ql =>
    types.some(t => ql.description.includes(t)) &&
    (ql.reference === "BASE_FREIGHT" || ql.reference === "SURCHARGE_EXPORT")
  );

  if (exportQuoteLines.length) {
    await prismaClient.invoiceLine.createMany({
      data: exportQuoteLines.map(q => ({
        invoiceId:  exportInvoice.id,
        description:q.description,
        amount:     q.amount.toNumber(),
        reference:  q.reference,
        glCode:     q.glCode,
        costCenter: q.costCenter
      }))
    });
    const sum1 = await prismaClient.invoiceLine.aggregate({
      where: { invoiceId: exportInvoice.id },
      _sum:  { amount: true }
    });
    await prismaClient.invoice.update({
      where: { id: exportInvoice.id },
      data:  { totalAmount: sum1._sum.amount! }
    });
  }

  // 8) Append B/L Generation Fee to EXPORT invoice
  const fee = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "B/L Generation Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (fee) {
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:  exportInvoice.id,
        description:"B/L Generation Fee",
        amount:     fee.amount,
        reference:  fee.surchargeDefId,
        glCode:     "6003-DOC",
        costCenter: "Documentation"
      }
    });
    const sum2 = await prismaClient.invoiceLine.aggregate({
      where: { invoiceId: exportInvoice.id },
      _sum:  { amount: true }
    });
    await prismaClient.invoice.update({
      where: { id: exportInvoice.id },
      data:  { totalAmount: sum2._sum.amount! }
    });
  }

  // 9) Return draft & invoice total
  return NextResponse.json(
    { draft, invoiceTotal: exportInvoice.totalAmount },
    { status: 201 }
  );
}
