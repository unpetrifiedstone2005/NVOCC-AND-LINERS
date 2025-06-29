// /api/seed/rateSheets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

const RateSheetPatchSchema = z.object({
  originPortId: z.string().optional(),
  destinationPortId: z.string().optional(),
  containerType: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  baseRate: z.string().optional(),
  currency: z.string().optional(),
  includedWeightKg: z.number().int().optional(),
  overweightRatePerKg: z.string().optional(),
  carrierId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  isDangerousGoods: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = RateSheetPatchSchema.parse(await req.json());

    // Build a new data object with correct types for Prisma
    const data: any = {};

    if (body.originPortId !== undefined) data.originPortId = body.originPortId;
    if (body.destinationPortId !== undefined) data.destinationPortId = body.destinationPortId;
    if (body.containerType !== undefined) data.containerType = body.containerType;
    if (body.validFrom !== undefined) data.validFrom = new Date(body.validFrom);
    if (body.validTo !== undefined) data.validTo = new Date(body.validTo);
    if (body.baseRate !== undefined) data.baseRate = new Prisma.Decimal(body.baseRate);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.includedWeightKg !== undefined) data.includedWeightKg = body.includedWeightKg;
    if (body.overweightRatePerKg !== undefined) data.overweightRatePerKg = new Prisma.Decimal(body.overweightRatePerKg);
    if ("carrierId" in body) data.carrierId = body.carrierId; // allow null
    if ("serviceId" in body) data.serviceId = body.serviceId; // allow null
    if (body.isDangerousGoods !== undefined) data.isDangerousGoods = body.isDangerousGoods;

    const updated = await prismaClient.rateSheet.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
