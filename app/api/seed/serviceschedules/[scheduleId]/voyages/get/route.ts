// app/api/seed/serviceschedules/[scheduleId]/voyages/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { scheduleId: string } }
) {
  // 0) Pull the scheduleId from the folder params
  const { scheduleId } = await params;

  // 1) Parse pagination & filter query params
  const url      = new URL(request.url);
  const page     = Math.max(1, parseInt(url.searchParams.get("page")  || "1", 10));
  const limit    = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const filter   = url.searchParams.get("voyageNumber") || undefined;

  // 2) Build the Prisma where clause
  const where: any = { serviceId: scheduleId };
  if (filter) {
    where.voyageNumber = { contains: filter, mode: "insensitive" };
  }

  try {
    // 3) Fetch page + count in parallel
    const [voyages, total] = await Promise.all([
      prismaClient.voyage.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { departure: "asc" },
        include: {
          service: { select: { id: true, code: true, description: true } },
          portCalls: true,
        },
      }),
      prismaClient.voyage.count({ where }),
    ]);

    // 4) Return paginated response
    return NextResponse.json({
      voyages,
      totalPages:  Math.ceil(total / limit),
      total,
      currentPage: page,
    });
  } catch (error) {
    console.error("GET /api/seed/serviceschedules/[scheduleId]/voyages/get error", error);
    return NextResponse.json(
      { error: "Failed to load voyages" },
      { status: 500 }
    );
  }
}
