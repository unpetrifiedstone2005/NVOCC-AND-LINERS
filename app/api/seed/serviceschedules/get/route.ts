// app/api/seed/serviceSchedules/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // pagination
  const page  = parseInt(url.searchParams.get("page")        || "1",  10);
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10));

  // optional filters
  const codeFilter = url.searchParams.get("code") || undefined;
  const descFilter = url.searchParams.get("description") || undefined;

  // build where clause
  const where: Record<string, any> = {};
  if (codeFilter) where.code = { contains: codeFilter, mode: "insensitive" };
  if (descFilter) where.description = { contains: descFilter, mode: "insensitive" };

  try {
    // parallel fetch + count
    const [items, total] = await Promise.all([
      prismaClient.serviceSchedule.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { code: "asc" },
       include: {
        voyages: {
           // You can paginate or sort here if you like; this will bring back _all_ voyages
           orderBy: { departure: "asc" },
           include: { portCalls: true },
         },
         _count: { select: { voyages: true } }, // optional, keep if you still need counts
       },
      }),
      prismaClient.serviceSchedule.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("GET /serviceSchedules error", err);
    return NextResponse.json(
      { error: "Failed to load service schedules" },
      { status: 500 }
    );
  }
}
