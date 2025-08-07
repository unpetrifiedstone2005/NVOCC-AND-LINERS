// File: app/api/seed/tariffs/get/route.ts
import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(request: Request) {
  const url       = new URL(request.url);
  const page      = Number(url.searchParams.get("page")    ?? 1);
  const limit     = Math.min(100, Number(url.searchParams.get("limit") ?? 20));

  // pull only the filters you actually use
  const serviceCode = url.searchParams.get("serviceCode") || undefined;
  const voyageId    = url.searchParams.get("voyageId")    || undefined;
  const commodity   = url.searchParams.get("commodity")   || undefined;
  const group       = url.searchParams.get("group")       || undefined;

  // build the WHERE clause
  const where: any = {};
  if (serviceCode)      where.schedule   = { code: serviceCode };
  if (voyageId)         where.voyageId  = voyageId;
  if (commodity)        where.commodity = commodity;
  if (group)            where.group     = group;

  try {
    const [ items, total ] = await Promise.all([
      prismaClient.tariff.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { validFrom: "desc" },
        include: {
          // include the related schedule (to get code/description)
          schedule: { select: { code: true, description: true } },
          // include the related voyage (to get voyageNumber)
          voyage:   { select: { voyageNumber: true } },
          // include the rates array
          rates:    true
        }
      }),
      prismaClient.tariff.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /seed/tariffs/get error", err);
    return NextResponse.json(
      { error: "Failed to load tariffs" },
      { status: 500 }
    );
  }
}
