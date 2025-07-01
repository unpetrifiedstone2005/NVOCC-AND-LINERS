// app/api/rate-sheets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

const RateSheetSchema = z.object({
  id:                  z.string().optional(),                  // client can supply or let DB generate
  originPortId:        z.string().optional().nullable(),       // now optional
  destinationPortId:   z.string().optional().nullable(),
  originDepotId:       z.string().optional().nullable(),       // new inland fields
  destinationDepotId:  z.string().optional().nullable(),
  containerType:       z.string(),
  validFrom:           z.string().datetime(),
  validTo:             z.string().datetime(),
  baseRate:            z.string(),
  currency:            z.string().optional().default("USD"),
  includedWeightKg:    z.number().int().optional(),
  overweightRatePerKg: z.string().optional(),
  carrierId:           z.string().optional().nullable(),
  serviceId:           z.string().optional().nullable(),
  isDangerousGoods:    z.boolean().optional().default(false),
});

const BodySchema = z.object({
  rateSheets: z.array(RateSheetSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { rateSheets } = BodySchema.parse(await req.json());

    // Map each incoming sheet into the shape Prisma expects
    const data = rateSheets.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      originPortId:        r.originPortId        ?? undefined,
      destinationPortId:   r.destinationPortId   ?? undefined,
      originDepotId:       r.originDepotId       ?? undefined,
      destinationDepotId:  r.destinationDepotId  ?? undefined,
      containerType:       r.containerType,
      validFrom:           new Date(r.validFrom),
      validTo:             new Date(r.validTo),
      baseRate:            new Prisma.Decimal(r.baseRate),
      currency:            r.currency,
      includedWeightKg:    r.includedWeightKg,
      overweightRatePerKg: r.overweightRatePerKg
                              ? new Prisma.Decimal(r.overweightRatePerKg)
                              : undefined,
      carrierId:           r.carrierId ?? undefined,
      serviceId:           r.serviceId ?? undefined,
      isDangerousGoods:    r.isDangerousGoods,
    }));

    const result = await prismaClient.rateSheet.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ seeded: result.count }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
