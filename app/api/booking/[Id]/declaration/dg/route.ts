// File: app/api/bookings/[bookingId]/declaration/dg/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";

// 1) Zod schema for each DG line
const LineSchema = z.object({
  unNumber:            z.string().min(1),
  properShippingName:  z.string().min(1),
  imoClass:            z.string().min(1),
  packingGroup:        z.string().min(1),
  packageType:         z.string().min(1),
  numberOfPackages:    z.number().int().min(1),
  netWeight:           z.number().nonnegative(),
  netWeightUnit:       z.enum(["kg","lb"]),
  grossWeight:         z.number().optional(),
  grossWeightUnit:     z.enum(["kg","lb"]).optional(),
});
const DGSchema = z.object({
  filingDate:       z.string().optional(),
  emergencyContact: z.string().optional(),
  lines:            z.array(LineSchema).min(1),
});
type DGPayload = z.infer<typeof DGSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 1) parse & validate
  let payload: DGPayload;
  try {
    payload = DGSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 2) find the SI for this booking
  const si = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    select: { id: true }
  });
  if (!si) {
    return NextResponse.json({ error: "Shipping Instruction not found" }, { status: 404 });
  }

  // 3) create the DG declaration
  const declaration = await prismaClient.declaration.create({
    data: {
      shippingInstructionId: si.id,
      declarationType:      "DG",
      filingDate:           payload.filingDate ? new Date(payload.filingDate) : undefined,
      emergencyContact:     payload.emergencyContact,
      lines: {
        create: payload.lines.map(l => ({
          unNumber:            l.unNumber,
          properShippingName:  l.properShippingName,
          imoClass:            l.imoClass,
          packingGroup:        l.packingGroup,
          packageType:         l.packageType,
          numberOfPackages:    l.numberOfPackages,
          netWeight:           l.netWeight,
          netWeightUnit:       l.netWeightUnit,
          grossWeight:         l.grossWeight,
          grossWeightUnit:     l.grossWeightUnit,
        }))
      }
    },
    include: { lines: true }
  });

  // 4) append the DG Declaration Fee to the invoice
  try {
    const feeRate = await prismaClient.surchargeRate.findFirst({
      where: { surchargeDef: { name: "DG Declaration Fee" } },
      select: { amount: true, surchargeDefId: true }
    });
    if (feeRate) {
      const invoice = await prismaClient.invoice.findUniqueOrThrow({
        where: { bookingId }
      });
      await prismaClient.invoiceLine.create({
        data: {
          invoiceId:   invoice.id,
          description: "DG Declaration Fee",
          amount:      feeRate.amount,
          reference:   feeRate.surchargeDefId,
          glCode:      "6003-DOC",
          costCenter:  "Documentation"
        }
      });
      const agg = await prismaClient.invoiceLine.aggregate({
        where: { invoiceId: invoice.id },
        _sum:  { amount: true }
      });
      await prismaClient.invoice.update({
        where: { id: invoice.id },
        data:  { totalAmount: agg._sum.amount! }
      });
    }
  } catch {
    // skip if invoice missing or fee undefined
  }

  return NextResponse.json(declaration, { status: 201 });
}
