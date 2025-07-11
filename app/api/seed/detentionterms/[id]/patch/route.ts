// File: app/api/detention-terms/[termId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z, ZodError } from "zod";

const DetentionTermPatchSchema = z.object({
  depotId:       z.string().uuid().optional().nullable(),
  carrierId:     z.string().uuid().optional().nullable(),
  freeDays:      z.number().int().optional(),
  ratePerDay:    z.string().optional(),
  currency:      z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo:   z.string().datetime().optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { termId: string } }
) {
  const { termId } = params;
  if (!termId || !/^[\w-]{36}$/.test(termId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const data = DetentionTermPatchSchema.parse(await req.json());

    const updated = await prismaClient.detentionTerm.update({
      where: { id: termId },
      data: {
        ...data,
        ratePerDay: data.ratePerDay ? parseFloat(data.ratePerDay) : undefined,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
