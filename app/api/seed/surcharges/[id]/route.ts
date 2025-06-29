// /api/seed/surcharges/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, SurchargeType } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

const SurchargePatchSchema = z.object({
  rateSheetId: z.string().optional(),
  surchargeType: z.nativeEnum(SurchargeType).optional(),
  amount: z.string().optional(),
  isPercentage: z.boolean().optional(),
  effectiveDate: z.string().datetime().optional(),
  appliesToDG: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = SurchargePatchSchema.parse(await req.json());

    // Build a new data object for Prisma, converting types as needed
    const data: any = {};
    if (body.rateSheetId !== undefined) data.rateSheetId = body.rateSheetId;
    if (body.surchargeType !== undefined) data.surchargeType = body.surchargeType;
    if (body.amount !== undefined) data.amount = new Prisma.Decimal(body.amount);
    if (body.isPercentage !== undefined) data.isPercentage = body.isPercentage;
    if (body.effectiveDate !== undefined) data.effectiveDate = new Date(body.effectiveDate);
    if (body.appliesToDG !== undefined) data.appliesToDG = body.appliesToDG;

    const updated = await prismaClient.surcharge.update({
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
