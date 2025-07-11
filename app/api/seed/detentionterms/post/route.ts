// File: app/api/detention-terms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z, ZodError } from "zod";

const DetentionTermCreateSchema = z.object({
  depotId:       z.string().uuid().optional().nullable(),
  carrierId:     z.string().uuid().optional().nullable(),
  freeDays:      z.number().int().min(0),
  ratePerDay:    z.string(), // as decimal string
  currency:      z.string().default("USD"),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo:   z.string().datetime().optional()
});

export async function POST(req: NextRequest) {
  try {
    const data = DetentionTermCreateSchema.parse(await req.json());

    const created = await prismaClient.detentionTerm.create({
      data: {
        ...data,
        ratePerDay: parseFloat(data.ratePerDay),
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
