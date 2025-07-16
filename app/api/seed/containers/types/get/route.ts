// app/api/seed/containers/types/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET() {
  try {
    // Fetch and return all container types, ordered by ISO code
    const items = await prismaClient.containerType.findMany({
      orderBy: { isoCode: "asc" },
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

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/seed/containers/types/get error:", error);
    return NextResponse.json(
      { error: "Failed to load container types" },
      { status: 500 }
    );
  }
}
