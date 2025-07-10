// File: app/api/bookings/[bookingId]/egm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient }            from "@/app/lib/db";
import { z, ZodError }             from "zod";
import { Leg, InvoiceStatus }      from "@prisma/client";

const EgmOverrides = z.object({
  vesselName:      z.string().optional(),
  voyageNumber:    z.string().optional(),
  portOfLoading:   z.string().optional(),
  portOfDischarge: z.string().optional(),
});
type EgmInput = z.infer<typeof EgmOverrides>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Parse & validate any overrides
  let overrides: EgmInput;
  try {
    overrides = EgmOverrides.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 3) Load booking, SI and CROContainers
  const [booking, si, croRecords] = await Promise.all([
    prismaClient.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true }
    }),
    prismaClient.shippingInstruction.findUnique({
      where: { bookingId },
      select: {
        id:               true,
        vesselName:       true,
        voyageNumber:     true,
        placeOfReceipt:   true,
        portOfLoading:    true,
        portOfDischarge:  true,
        finalDestination: true
      }
    }),
    prismaClient.cROContainer.findMany({
      where: { cro: { bookingId } },
      include: { container: { select: { containerNo: true, containerTypeIsoCode: true } } }
    })
  ]);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!si) {
    return NextResponse.json({ error: "Shipping Instruction not found" }, { status: 404 });
  }
  if (croRecords.length === 0) {
    return NextResponse.json({ error: "No CRO containers found" }, { status: 400 });
  }

  // 4) Derive mandatory manifest fields, error if still null
  const vesselName   = overrides.vesselName    ?? si.vesselName!;
  const voyageNumber = overrides.voyageNumber  ?? si.voyageNumber!;
  const portOfLoading = (overrides.portOfLoading ?? si.portOfLoading);
  const portOfDischarge = (overrides.portOfDischarge ?? si.portOfDischarge);

  if (!portOfLoading || !portOfDischarge) {
    return NextResponse.json(
      { error: "portOfLoading and portOfDischarge must be provided or exist on the SI" },
      { status: 400 }
    );
  }

  // 5) Assemble the manifest payload from the DB
  const manifest = {
    vesselName,
    voyageNumber,
    portOfLoading,
    portOfDischarge,
    placeOfReceipt:   si.placeOfReceipt!,
    finalDestination: si.finalDestination!,
    containers: await Promise.all(
      croRecords.map(async r => {
        const sic = await prismaClient.shippingInstructionContainer.findFirst({
          where: {
            shippingInstructionId: si.id,
            containerNumber:       r.container.containerNo
          },
          include: { cargoes: true }
        });
        return {
          containerNumber: r.container.containerNo,
          type:            r.container.containerTypeIsoCode,
          cargo:           sic?.cargoes.map(cg => ({
                              hsCode:      cg.hsCode,
                              description: cg.description,
                              grossWeight: cg.grossWeight,
                              netWeight:   cg.netWeight,
                              packages:    cg.noOfPackages
                            })) ?? []
        };
      })
    )
  };

  // 6) Create the EGM record
  const egm = await prismaClient.eGM.create({
    data: {
      bookingId,
      vesselName,
      voyageNumber,
      portOfLoading,
      portOfDischarge,
      data: manifest
    }
  });

  // 7) Upsert EXPORT invoice and bill EGM fee
  const defaultBank = await prismaClient.bankAccount.findFirst({
    where: { isActive: true }, select: { id: true }
  });
  const exportInv = await prismaClient.invoice.upsert({
    where:    { bookingId_leg: { bookingId, leg: Leg.EXPORT } },
    create:   {
      bookingId,
      userId:        booking.userId,
      leg:           Leg.EXPORT,
      totalAmount:   0,
      issuedDate:    new Date(),
      dueDate:       new Date(Date.now() + 30*24*60*60*1000),
      status:        InvoiceStatus.PENDING,
      description:   `Export invoice for booking ${bookingId}`,
      bankAccountId: defaultBank?.id!
    },
    update: {}
  });
  const egmFee = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "EGM Generation Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (egmFee) {
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:   exportInv.id,
        description: "EGM Generation Fee",
        amount:      egmFee.amount,
        reference:   egmFee.surchargeDefId,
        glCode:      "6003-DOC",
        costCenter:  "Documentation"
      }
    });
  }

  // 8) Recompute invoice total
  const sum = await prismaClient.invoiceLine.aggregate({
    where: { invoiceId: exportInv.id }, _sum: { amount: true }
  });
  await prismaClient.invoice.update({
    where: { id: exportInv.id },
    data:  { totalAmount: sum._sum.amount ?? 0 }
  });

  // 9) Return both the EGM record and the export invoice
  const invoiceWithLines = await prismaClient.invoice.findUnique({
    where: { id: exportInv.id }, include: { lines: true }
  });
  return NextResponse.json(
    { egm, exportInvoice: invoiceWithLines },
    { status: 201 }
  );
}
