import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

const WeightBracketSchema = z.object({
  id: z.string(),
  rateSheetId: z.string(),
  minWeightKg: z.number().int(),
  maxWeightKg: z.number().int(),
  ratePerKg: z.string(),
});
const BodySchema = z.object({
  weightBrackets: z.array(WeightBracketSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { weightBrackets } = BodySchema.parse(await req.json());
    const wbData = weightBrackets.map((w) => ({
      id: w.id,
      rateSheetId: w.rateSheetId,
      minWeightKg: w.minWeightKg,
      maxWeightKg: w.maxWeightKg,
      ratePerKg: new Prisma.Decimal(w.ratePerKg),
    }));
    const wb = await prismaClient.weightBracket.createMany({
      data: wbData,
      skipDuplicates: true,
    });
    return NextResponse.json({ seeded: { weightBrackets: wb.count } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
