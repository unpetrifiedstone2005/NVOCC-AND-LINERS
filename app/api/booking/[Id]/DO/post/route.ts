// File: app/api/bookings/[bookingId]/delivery-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { Leg, InvoiceStatus }       from "@prisma/client";

const CreateDOSchema = z.object({
  recipientType:    z.enum(["TRUCKER","CONSIGNEE","OTHER"]),
  recipientId:      z.string().min(1),
  deliveryLocation: z.string().optional(),
  documents: z
    .array(z.object({
      type: z.string(),
      url:  z.string().url()
    }))
    .optional()
});
type CreateDOInput = z.infer<typeof CreateDOSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Parse & validate body
  let input: CreateDOInput;
  try {
    input = CreateDOSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 3) Ensure booking exists + get userId
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 4) Create the Delivery Order
  const doRecord = await prismaClient.deliveryOrder.create({
    data: {
      bookingId,
      recipientType:    input.recipientType,
      recipientId:      input.recipientId,
      deliveryLocation: input.deliveryLocation,
      documents: input.documents
        ? { create: input.documents.map(d => ({ type: d.type, url: d.url })) }
        : undefined
    },
    include: {
      documents: true
    }
  });

  // 5) Upsert the IMPORT‐leg invoice
  const defaultBank = await prismaClient.bankAccount.findFirst({
    where: { isActive: true },
    select: { id: true }
  });
  let importInvoice = await prismaClient.invoice.findFirst({
    where: { bookingId, leg: Leg.IMPORT }
  });
  if (!importInvoice) {
    importInvoice = await prismaClient.invoice.create({
      data: {
        bookingId,
        userId:        booking.userId,
        leg:           Leg.IMPORT,
        totalAmount:   0,
        issuedDate:    new Date(),
        dueDate:       new Date(Date.now() + 30*24*60*60*1000),
        status:        InvoiceStatus.PENDING,
        description:   `Import invoice for booking ${bookingId}`,
        bankAccountId: defaultBank?.id!
      }
    });
  }

  // 6) Add the Delivery Order Fee line to the IMPORT invoice
  const doFee = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "Delivery Order Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (doFee) {
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:   importInvoice.id,
        description: "Delivery Order Fee",
        amount:      doFee.amount,
        reference:   doFee.surchargeDefId,
        glCode:      "6003-DOC",
        costCenter:  "Administration"
      }
    });
  }

  // 7) Re‐aggregate IMPORT invoice total
  const agg = await prismaClient.invoiceLine.aggregate({
    where: { invoiceId: importInvoice.id },
    _sum:  { amount: true }
  });
  await prismaClient.invoice.update({
    where: { id: importInvoice.id },
    data:  { totalAmount: agg._sum.amount ?? 0 }
  });

  // 8) Fetch updated import invoice with its lines
  const invoiceWithLines = await prismaClient.invoice.findUnique({
    where: { id: importInvoice.id },
    include: { lines: true }
  });

  // 9) Return both the DO record and the updated import invoice
  return NextResponse.json(
    { deliveryOrder: doRecord, importInvoice: invoiceWithLines },
    { status: 201 }
  );
}
