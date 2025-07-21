// app/api/containers/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(request: Request) {
  const url    = new URL(request.url);
  const page   = Number(url.searchParams.get("page")  ?? "1");
  const limit  = Number(url.searchParams.get("limit") ?? "20");

  // 1) extract filters (if present)
  const containerNo          = url.searchParams.get("containerNo")     || undefined;
  const containerTypeIsoCode = url.searchParams.get("containerTypeIsoCode") || undefined;
  const status               = url.searchParams.get("status")          || undefined;
  const currentDepot         = url.searchParams.get("currentDepot")    || undefined;
  const ownership            = url.searchParams.get("ownership")       || undefined;

  // 2) build Prisma where clause
  const where: any = {};
  if (containerNo)          where.containerNo          = { contains: containerNo, mode: "insensitive" };
  if (containerTypeIsoCode) where.containerTypeIsoCode = containerTypeIsoCode;
  if (status)               where.status               = status;
  if (currentDepot)         where.currentDepot         = { contains: currentDepot, mode: "insensitive" };
  if (ownership)            where.ownership            = { contains: ownership, mode: "insensitive" };

  try {
    // 3) run paged query + count in parallel
    const [containers, total] = await Promise.all([
      prismaClient.container.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { containerNo: "asc" },
      }),
      prismaClient.container.count({ where }),
    ]);

    // 4) respond with the page slice + metadata
    return NextResponse.json({
      containers,
      totalPages:  Math.ceil(total / limit),
      total,
      currentPage: page,
    });
  } catch (error) {
    console.error("GET /api/seed/containers/get error", error);
    return NextResponse.json(
      { error: "Failed to load containers" },
      { status: 500 }
    );
  }
}
