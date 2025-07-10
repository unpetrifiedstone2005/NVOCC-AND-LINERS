// File: app/api/bookings/[bookingId]/declaration/customs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";
import { DeclarationType }         from "@prisma/client";

// 1) Zod schema for a customs declaration
const CustomsSchema = z.object({
  filingDate:       z.string().optional(),     // ISO date or omit
  value:            z.number().nonnegative(),  // declared shipment value
  currency:         z.string().length(3),      // e.g. "USD"
  dutiesAmount:     z.number().nonnegative(),  // duties to declare
  emergencyContact: z.string().optional(),
});
type CustomsPayload = z.infer<typeof CustomsSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 1) parse & validate
  let payload: CustomsPayload;
  try {
    payload = CustomsSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 2) find the SI
  const si = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    select: { id: true }
  });
  if (!si) {
    return NextResponse.json({ error: "SI not found for booking" }, { status: 404 });
  }

  // 3) create the customs declaration
  const declaration = await prismaClient.declaration.create({
    data: {
      shippingInstructionId: si.id,
      declarationType:      DeclarationType.CUSTOMS,
      filingDate:           payload.filingDate ? new Date(payload.filingDate) : undefined,
      value:                payload.value,
      currency:             payload.currency,
      dutiesAmount:         payload.dutiesAmount,
      emergencyContact:     payload.emergencyContact,
    }
  });

  // 4) append a “Customs Brokerage Fee” to the **EXPORT** invoice
  try {
    const feeRate = await prismaClient.surchargeRate.findFirst({
      where: { surchargeDef: { name: "Customs Brokerage Fee" } },
      select: { amount: true, surchargeDefId: true }
    });
    if (feeRate) {
      // find-or-create the EXPORT invoice
      const exportInvoice = await prismaClient.invoice.findFirst({
        where: { bookingId, leg: "EXPORT" }
      }) ?? await prismaClient.invoice.create({
        data: {
          bookingId,
          // assume you fetch userId from booking or context
          userId:        declaration.createdById!,  
          leg:           "EXPORT",
          totalAmount:   0,
          issuedDate:    new Date(),
          dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status:        "PENDING",
          description:   "Export invoice",
          bankAccountId: (await prismaClient.bankAccount.findFirst({
            where: { isActive: true },
            select: { id: true }
          }))!.id
        }
      });

      // create the fee line
      await prismaClient.invoiceLine.create({
        data: {
          invoiceId:   exportInvoice.id,
          description: "Customs Brokerage Fee",
          amount:      feeRate.amount,
          reference:   feeRate.surchargeDefId,
          glCode:      "6003-DOC",
          costCenter:  "Customs"
        }
      });

      // re-aggregate total
      const agg = await prismaClient.invoiceLine.aggregate({
        where: { invoiceId: exportInvoice.id },
        _sum:  { amount: true }
      });
      await prismaClient.invoice.update({
        where: { id: exportInvoice.id },
        data:  { totalAmount: agg._sum.amount! }
      });
    }
  } catch {
    // safe to ignore if invoice or feeDef missing
  }

  return NextResponse.json(declaration, { status: 201 });
}
