import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, SurchargeType } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

// Zod schemas for validation
const RateSheetSchema = z.object({
  id: z.string(),
  originPortId: z.string(),
  destinationPortId: z.string(),
  containerType: z.string(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  baseRate: z.string(),
  currency: z.string().optional().default("USD"),
  includedWeightKg: z.number().int().optional(),
  overweightRatePerKg: z.string().optional(),
  carrierId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
});
const WeightBracketSchema = z.object({
  id: z.string(),
  rateSheetId: z.string(),
  minWeightKg: z.number().int(),
  maxWeightKg: z.number().int(),
  ratePerKg: z.string(),
});
const SurchargeSchema = z.object({
  id: z.string(),
  rateSheetId: z.string(),
  surchargeType: z.nativeEnum(SurchargeType),
  amount: z.string(),
});
const BodySchema = z.object({
  rateSheets: z.array(RateSheetSchema),
  weightBrackets: z.array(WeightBracketSchema),
  surcharges: z.array(SurchargeSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { rateSheets, weightBrackets, surcharges } = BodySchema.parse(
      await req.json()
    );

    // Normalize rateSheets
    const rsData = rateSheets.map((r) => ({
      id: r.id,
      originPortId: r.originPortId,
      destinationPortId: r.destinationPortId,
      containerType: r.containerType,
      validFrom: new Date(r.validFrom),
      validTo: new Date(r.validTo),
      baseRate: new Prisma.Decimal(r.baseRate),
      currency: r.currency,
      includedWeightKg: r.includedWeightKg,
      overweightRatePerKg: r.overweightRatePerKg
        ? new Prisma.Decimal(r.overweightRatePerKg)
        : undefined,
      carrierId: r.carrierId ?? undefined,
      serviceId: r.serviceId ?? undefined,
    }));

    // Normalize weightBrackets
    const wbData = weightBrackets.map((w) => ({
      id: w.id,
      rateSheetId: w.rateSheetId,
      minWeightKg: w.minWeightKg,
      maxWeightKg: w.maxWeightKg,
      ratePerKg: new Prisma.Decimal(w.ratePerKg),
    }));

    // Normalize surcharges
    const scData = surcharges.map((s) => ({
      id: s.id,
      rateSheetId: s.rateSheetId,
      surchargeType: s.surchargeType,
      amount: new Prisma.Decimal(s.amount),
    }));

    // Insert in correct order: rateSheets → weightBrackets → surcharges
    const rs = await prismaClient.rateSheet.createMany({
      data: rsData,
      skipDuplicates: true,
    });
    const wb = await prismaClient.weightBracket.createMany({
      data: wbData,
      skipDuplicates: true,
    });
    const sc = await prismaClient.surcharge.createMany({
      data: scData,
      skipDuplicates: true,
    });

    return NextResponse.json(
      {
        seeded: {
          rateSheets: rs.count,
          weightBrackets: wb.count,
          surcharges: sc.count,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
