import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, SurchargeType } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

const SurchargeSchema = z.object({
  id: z.string(),
  rateSheetId: z.string(),
  surchargeType: z.nativeEnum(SurchargeType),
  amount: z.string(),
});
const BodySchema = z.object({
  surcharges: z.array(SurchargeSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { surcharges } = BodySchema.parse(await req.json());
    const scData = surcharges.map((s) => ({
      id: s.id,
      rateSheetId: s.rateSheetId,
      surchargeType: s.surchargeType,
      amount: new Prisma.Decimal(s.amount),
    }));
    const sc = await prismaClient.surcharge.createMany({
      data: scData,
      skipDuplicates: true,
    });
    return NextResponse.json({ seeded: { surcharges: sc.count } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
