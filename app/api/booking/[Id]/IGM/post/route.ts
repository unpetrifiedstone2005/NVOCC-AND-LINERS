// File: app/api/bookings/[bookingId]/igm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient }             from "@/app/lib/db";
import { z, ZodError }              from "zod";
import { Leg, InvoiceStatus }       from "@prisma/client";

const IgmOverrides = z.object({
  vesselName:      z.string().optional(),
  voyageNumber:    z.string().optional(),
  portOfLoading:   z.string().optional(),
  portOfDischarge: z.string().optional(),
});
type IgmInput = z.infer<typeof IgmOverrides>;

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
  let overrides: IgmInput;
  try {
    overrides = IgmOverrides.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 3) Load booking and SI containers
  const [booking, si, sicRows] = await Promise.all([
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
        portOfLoading:    true,
        portOfDischarge:  true
      }
    }),
    prismaClient.shippingInstructionContainer.findMany({
      where: { shippingInstructionId: bookingId },
      include: { cargoes: true }
    })
  ]);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!si) {
    return NextResponse.json({ error: "Shipping Instruction not found" }, { status: 404 });
  }
  if (sicRows.length === 0) {
    return NextResponse.json({ error: "No SI containers found" }, { status: 400 });
  }

  // 4) Derive mandatory manifest fields
  const vesselName     = overrides.vesselName    ?? si.vesselName!;
  const voyageNumber   = overrides.voyageNumber  ?? si.voyageNumber!;
  const portOfLoading  = overrides.portOfLoading ?? si.portOfLoading;
  const portOfDischarge= overrides.portOfDischarge ?? si.portOfDischarge;
  if (!portOfLoading || !portOfDischarge) {
    return NextResponse.json(
      { error: "portOfLoading and portOfDischarge must be provided or exist on the SI" },
      { status: 400 }
    );
  }

  // 5) Assemble IGM manifest from SI containers
  const manifest = {
    vesselName,
    voyageNumber,
    portOfLoading,
    portOfDischarge,
    containers: sicRows.map(c => ({
      containerNumber: c.containerNumber,
      cargo: c.cargoes.map(cg => ({
        hsCode:      cg.hsCode,
        description: cg.description,
        grossWeight: cg.grossWeight,
        netWeight:   cg.netWeight,
        packages:    cg.noOfPackages
      }))
    }))
  };

  // 6) Create the IGM record
  const igm = await prismaClient.iGM.create({
    data: {
      bookingId,
      vesselName,
      voyageNumber,
      portOfLoading,
      portOfDischarge,
      data: manifest
    }
  });

  // 7) Upsert the IMPORT‐leg invoice and bill IGM fee
  const defaultBank = await prismaClient.bankAccount.findFirst({
    where: { isActive: true }, select: { id: true }
  });
  const importInv = await prismaClient.invoice.upsert({
    where:    { bookingId_leg: { bookingId, leg: Leg.IMPORT } },
    create:   {
      bookingId,
      userId:        booking.userId,
      leg:           Leg.IMPORT,
      totalAmount:   0,
      issuedDate:    new Date(),
      dueDate:       new Date(Date.now() + 30*24*60*60*1000),
      status:        InvoiceStatus.PENDING,
      description:   `Import invoice for booking ${bookingId}`,
      bankAccountId: defaultBank?.id!
    },
    update: {}
  });
  const igmFee = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "IGM Filing Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (igmFee) {
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:   importInv.id,
        description: "IGM Filing Fee",
        amount:      igmFee.amount,
        reference:   igmFee.surchargeDefId,
        glCode:      "6003-DOC",
        costCenter:  "Documentation"
      }
    });
  }

  // 8) Recompute IMPORT invoice total
  const sum = await prismaClient.invoiceLine.aggregate({
    where: { invoiceId: importInv.id }, _sum: { amount: true }
  });
  await prismaClient.invoice.update({
    where: { id: importInv.id },
    data:  { totalAmount: sum._sum.amount ?? 0 }
  });

  // 9) Fetch updated invoice lines
  const invoiceWithLines = await prismaClient.invoice.findUnique({
    where: { id: importInv.id }, include: { lines: true }
  });

  // 10) Return both the IGM record and the import invoice
  return NextResponse.json(
    { igm, importInvoice: invoiceWithLines },
    { status: 201 }
  );
}
