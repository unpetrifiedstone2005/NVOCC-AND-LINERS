// /api/seed/weightBrackets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

// Accept ratePerKg as string in the API
const WeightBracketPatchSchema = z.object({
  rateSheetId: z.string().optional(),
  minWeightKg: z.number().int().optional(),
  maxWeightKg: z.number().int().optional(),
  ratePerKg: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = WeightBracketPatchSchema.parse(await req.json());

    // Build a new data object for Prisma, converting types as needed
    const data: any = {};
    if (body.rateSheetId !== undefined) data.rateSheetId = body.rateSheetId;
    if (body.minWeightKg !== undefined) data.minWeightKg = body.minWeightKg;
    if (body.maxWeightKg !== undefined) data.maxWeightKg = body.maxWeightKg;
    if (body.ratePerKg !== undefined) data.ratePerKg = new Prisma.Decimal(body.ratePerKg);

    const updated = await prismaClient.weightBracket.update({
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
