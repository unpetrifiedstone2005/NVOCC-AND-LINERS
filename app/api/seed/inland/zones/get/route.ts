import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

// GET /api/seed/inland/zones/get?page=1&limit=20&q=del
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Number(searchParams.get("page")  ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const qRaw  = (searchParams.get("q") ?? "").trim();

    // Build where safely for Prisma
    const where: import("@prisma/client").Prisma.InlandZoneWhereInput = qRaw
      ? {
          OR: [
            { name:    { contains: qRaw, mode: "insensitive" } },
            { country: { contains: qRaw, mode: "insensitive" } },
            // If you're on Postgres, this matches exact prefix elements:
            // comment this line out if your DB isn't Postgres or you don't store prefixes.
            { postalPrefixes: { has: qRaw } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prismaClient.inlandZone.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaClient.inlandZone.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
    });
  } catch (err: any) {
    console.error("GET /inland/zones/get error:", err);
    const message =
      err?.meta?.cause || err?.message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
