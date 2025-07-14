// File: app/api/container-types/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const QuerySchema = z.object({
  /** Only return the type with this exact ISO code */
  iso: z.string().optional(),
  /** Maximum number of types to return */
  maxCount: z
    .preprocess((val) => (val !== null ? Number(val) : undefined), z.number().int().min(1))
    .default(100),
});

export async function GET(request: Request) {
  let q;
  try {
    const url = new URL(request.url);
    q = QuerySchema.parse({
      iso: url.searchParams.get("iso") ?? undefined,
      maxCount: url.searchParams.get("maxCount"),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  try {
    const whereClause = q.iso
      ? { isoCode: q.iso }
      : {}; // no filter → all types

    const types = await prismaClient.containerType.findMany({
      where: whereClause,
      orderBy: { isoCode: "asc" },
      take: q.maxCount,
      select: {
        isoCode: true,
        name: true,
        lengthMm: true,
        widthMm: true,
        heightMm: true,
        maxStackWeightKg: true,
        tareWeightKg: true,
        maxGrossWeightKg: true,
        group: true,
        teuFactor: true,
      },
    });

    return NextResponse.json({ items: types }, { status: 200 });
  } catch (error) {
    console.error("GET /api/container-types error", error);
    return NextResponse.json(
      { error: "Failed to load container types" },
      { status: 500 }
    );
  }
}
