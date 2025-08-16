import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import type { Prisma } from "@prisma/client";

// What the FE expects (no nullable ports)
type VoyageRow = {
  id: string;
  service: { id: string; code: string } | null;
  voyageNumber: string;
  vesselName: string;
  // send ISO strings so JSON is clean
  etdUtc: string;
  etaUtc: string;
  departure: string;
  arrival: string;
  loadPortUnlocode: string;
  dischargePortUnlocode: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  // optional filters
  const polParam = url.searchParams.get("pol")?.toUpperCase() || undefined; // UN/LOCODE
  const podParam = url.searchParams.get("pod")?.toUpperCase() || undefined; // UN/LOCODE
  const validFrom = url.searchParams.get("validFrom") || undefined;         // YYYY-MM-DD or ISO
  const serviceCode = url.searchParams.get("serviceCode") || undefined;

  // pagination
  const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));

  // build where (make ports non-null so we can guarantee strings)
  const where: Prisma.VoyageWhereInput = {
    loadPortUnlocode: { not: null },
    dischargePortUnlocode: { not: null },
    ...(polParam ? { loadPortUnlocode: polParam } : {}),
    ...(podParam ? { dischargePortUnlocode: podParam } : {}),
    ...(serviceCode
      ? { service: { code: { equals: serviceCode, mode: "insensitive" } } }
      : {}),
  };

  // date filter (match either explicit UTC columns or legacy columns)
  if (validFrom) {
    const from = new Date(validFrom);
    where.OR = [
      { etdUtc: { gte: from } },
      { departure: { gte: from } },
    ];
  }

  try {
    const [rows, total] = await Promise.all([
      prismaClient.voyage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ etdUtc: "asc" }, { departure: "asc" }],
        include: {
          service: { select: { id: true, code: true } },
        },
      }),
      prismaClient.voyage.count({ where }),
    ]);

    // Run-time guard + map to non-nullable DTO
    const voyages: VoyageRow[] = rows
      .filter(v => v.loadPortUnlocode && v.dischargePortUnlocode) // safety
      .map(v => ({
        id: v.id,
        service: v.service ? { id: v.service.id, code: v.service.code } : null,
        voyageNumber: v.voyageNumber,
        vesselName: v.vesselName,
        etdUtc: (v.etdUtc ?? v.departure ?? new Date(0)).toISOString(),
        etaUtc: (v.etaUtc ?? v.arrival ?? new Date(0)).toISOString(),
        departure: (v.departure ?? v.etdUtc ?? new Date(0)).toISOString(),
        arrival: (v.arrival ?? v.etaUtc ?? new Date(0)).toISOString(),
        loadPortUnlocode: v.loadPortUnlocode!,          // guaranteed by filter
        dischargePortUnlocode: v.dischargePortUnlocode!,// guaranteed by filter
      }));

    return NextResponse.json({
      voyages,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/seed/voyages/get failed:", err);
    return NextResponse.json(
      { error: "Failed to load voyages" },
      { status: 500 }
    );
  }
}
