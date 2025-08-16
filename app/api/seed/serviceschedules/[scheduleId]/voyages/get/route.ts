// app/api/seed/serviceschedules/[scheduleId]/voyages/get/route.ts
import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { scheduleId: string } }
) {
  // ⬇️ no await here
  const { scheduleId } = await params;

  const url   = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const voyageNumberFilter = url.searchParams.get("voyageNumber") || undefined;
  const includeService = url.searchParams.get("includeService") === "true";

  const where: any = { serviceId: scheduleId };
  if (voyageNumberFilter) {
    where.voyageNumber = { contains: voyageNumberFilter, mode: "insensitive" };
  }

  // Build include dynamically to match the flag
  const include: any = {
    loadPort: {
      select: { unlocode: true, name: true, city: true, country: true, type: true },
    },
    dischargePort: {
      select: { unlocode: true, name: true, city: true, country: true, type: true },
    },
  };
  if (includeService) {
    include.service = { select: { id: true, code: true, description: true } };
  }

  try {
    const [rows, total] = await Promise.all([
      prismaClient.voyage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ etdUtc: "asc" }, { departure: "asc" }],
        include,
      }),
      prismaClient.voyage.count({ where }),
    ]);

    // Provide FE-friendly aliases POL/POD as well
    const voyages = rows.map((v) => ({
      ...v,
      polUnlocode: v.loadPortUnlocode,
      podUnlocode: v.dischargePortUnlocode,
    }));

    return NextResponse.json({
      voyages,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /voyages failed:", err);
    return NextResponse.json({ error: "Failed to load voyages" }, { status: 500 });
  }
}
