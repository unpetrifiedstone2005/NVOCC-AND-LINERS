// File: app/api/seed/services/get/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page        = Number(url.searchParams.get("page")       ?? "1");
  const codeFilter  = url.searchParams.get("code")              || undefined;
  const descFilter  = url.searchParams.get("description")       || undefined;
  const limit       = 20;

  const where: any = {};
  if (codeFilter) where.code        = { contains: codeFilter, mode: "insensitive" };
  if (descFilter) where.description = { contains: descFilter, mode: "insensitive" };

  try {
    const [services, total] = await Promise.all([
      prismaClient.service.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { code: "asc" },
      }),
      prismaClient.service.count({ where }),
    ]);

    return NextResponse.json({
      services,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/seed/services/get error", err);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}
