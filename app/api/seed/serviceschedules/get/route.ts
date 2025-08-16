// app/api/seed/serviceSchedules/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // pagination (safe defaults)
  const pageRaw  = parseInt(url.searchParams.get("page")  || "1", 10);
  const limitRaw = parseInt(url.searchParams.get("limit") || "20", 10);
  const page  = Number.isFinite(pageRaw)  && pageRaw  > 0 ? pageRaw  : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, limitRaw) : 20;

  // optional filters
  const codeFilter = url.searchParams.get("code") || undefined;
  const descFilter = url.searchParams.get("description") || undefined;

  // optionally include voyages to keep payloads light by default
  const includeVoyages = url.searchParams.get("includeVoyages") === "true";

  // build where clause
  const where: Record<string, any> = {};
  if (codeFilter) where.code = { contains: codeFilter, mode: "insensitive" };
  if (descFilter) where.description = { contains: descFilter, mode: "insensitive" };

  try {
    const [items, total] = await Promise.all([
      prismaClient.serviceSchedule.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { code: "asc" },
        include: {
          ...(includeVoyages
            ? {
                voyages: {
                  orderBy: { departure: "asc" },
                  // NOTE: `Voyage` no longer has `portCalls`, so don't include it.
                  // Select a compact set of fields to avoid huge payloads.
                  select: {
                    id: true,
                    serviceId: true,
                    voyageNumber: true,
                    vesselName: true,
                    departure: true,
                    arrival: true,
                  },
                },
              }
            : {}),
          _count: { select: { voyages: true } },
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
