// File: app/api/bookings/[bookingId]/declaration/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";

// 1) Zod schema for each DG/customs line
const LineSchema = z.object({
  unNumber:            z.string().min(1),
  properShippingName:  z.string().min(1),
  imoClass:            z.string().min(1),
  packingGroup:        z.string().min(1),
  flashPointC:         z.number().optional(),
  flashPointF:         z.number().optional(),
  packageType:         z.string().min(1),
  numberOfPackages:    z.number().int().min(1),
  netWeight:           z.number().nonnegative(),
  netWeightUnit:       z.enum(["kg","lb"]),
  grossWeight:         z.number().optional(),
  grossWeightUnit:     z.enum(["kg","lb"]).optional(),
});

// 2) Zod schema for the full declaration payload
const DeclarationSchema = z.object({
  declarationType:      z.enum(["CUSTOMS","DG"]),
  filingDate:           z.string().optional(), // ISO date or default now()
  // financials only for CUSTOMS
  value:                z.number().nonnegative().optional(),
  currency:             z.string().length(3).optional(),
  dutiesAmount:         z.number().nonnegative().optional(),
  emergencyContact:     z.string().optional(),
  // lines are required for DG, optional for customs
  lines:                z.array(LineSchema).min(1),
});
type DeclarationPayload = z.infer<typeof DeclarationSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // validate bookingId
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // parse + validate body
  let payload: DeclarationPayload;
  try {
    payload = DeclarationSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // find the SI
  const si = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    select: { id: true }
  });
  if (!si) {
    return NextResponse.json({ error: "SI not found for booking" }, { status: 404 });
  }

  // prepare declaration data
  const declData: any = {
    shippingInstructionId: si.id,
    declarationType:      payload.declarationType,
    filingDate:           payload.filingDate
                            ? new Date(payload.filingDate)
                            : undefined,
    value:                payload.value,
    currency:             payload.currency,
    dutiesAmount:         payload.dutiesAmount,
    emergencyContact:     payload.emergencyContact,
    lines: {
      create: payload.lines.map(line => ({
        unNumber:            line.unNumber,
        properShippingName:  line.properShippingName,
        imoClass:            line.imoClass,
        packingGroup:        line.packingGroup,
        flashPointC:         line.flashPointC,
        flashPointF:         line.flashPointF,
        packageType:         line.packageType,
        numberOfPackages:    line.numberOfPackages,
        netWeight:           line.netWeight,
        netWeightUnit:       line.netWeightUnit,
        grossWeight:         line.grossWeight,
        grossWeightUnit:     line.grossWeightUnit,
      }))
    }
  };

  try {
    const declaration = await prismaClient.declaration.create({
      data: declData,
      include: { lines: true }
    });
    return NextResponse.json(declaration, { status: 201 });
  } catch (err) {
    console.error("Declaration creation failed:", err);
    return NextResponse.json({ error: "Failed to create declaration" }, { status: 500 });
  }
}
