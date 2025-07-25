import { NextResponse } from "next/server";
import { prismaClient }  from "@/app/lib/db";

export async function GET(request: Request) {
  try {
    const url   = new URL(request.url);
    const page  = Number(url.searchParams.get("page")  ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "20");

    const [voyages, total] = await Promise.all([
      prismaClient.voyage.findMany({
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { departure: "asc" },
        include: {
          service: {
            select: { id: true, code: true, description: true } // ✅ only fetch what you need
          },
          portCalls: true,
        },
      }),
      prismaClient.voyage.count(),
    ]);

    return NextResponse.json({
      voyages,
      totalPages:  Math.ceil(total / limit),
      total,
      currentPage: page,
    });
  } catch (err: any) {
    console.error("🚨 GET /api/seed/voyages/get error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
