import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

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
const BodySchema = z.object({
  rateSheets: z.array(RateSheetSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { rateSheets } = BodySchema.parse(await req.json());
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
    const rs = await prismaClient.rateSheet.createMany({
      data: rsData,
      skipDuplicates: true,
    });
    return NextResponse.json({ seeded: { rateSheets: rs.count } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
