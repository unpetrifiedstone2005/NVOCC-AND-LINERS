// app/api/seed/inland/zones/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const Params = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, q } = Params.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q") ?? undefined,
    });

    const where: Prisma.InlandZoneWhereInput = q
      ? {
          OR: [
            {
              name: {
                contains: q,
                mode: Prisma.QueryMode.insensitive, // <-- key fix
              },
            },
            {
              country: {
                contains: q,
                mode: Prisma.QueryMode.insensitive, // <-- key fix
              },
            },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prismaClient.inlandZone.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { inlandRates: true } },
        },
      }),
      prismaClient.inlandZone.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch inland zones" },
      { status: 400 }
    );
  }
}
