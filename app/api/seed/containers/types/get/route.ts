// app/api/seed/containers/types/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { Prisma, ContainerGroup } from "@prisma/client";

export async function GET(request: Request) {
  const url        = new URL(request.url);
  const groupParam = url.searchParams.get("group") ?? undefined;

  // Build an *optional* where clause
  // - if groupParam is one of our enum values, filter by it
  // - otherwise leave 'where' empty to return everything
  const where: Prisma.ContainerTypeWhereInput = {};
  if (
    groupParam &&
    (Object.values(ContainerGroup) as string[]).includes(groupParam)
  ) {
    where.group = groupParam as ContainerGroup;
  }

  try {
    const items = await prismaClient.containerType.findMany({
      where,                  // <-- if empty {}, returns all
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
