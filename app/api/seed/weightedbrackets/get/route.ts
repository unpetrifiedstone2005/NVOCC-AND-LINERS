// /app/api/surcharges/route.ts
import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const name = searchParams.get("name");
  const sortBy = searchParams.get("sortBy") || "id";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const skip = (page - 1) * limit;
  const where: any = {};
  if (id) where.id = id;
  if (type) where.type = type;
  if (name) where.name = { contains: name, mode: "insensitive" };

  const [data, total] = await Promise.all([
    prismaClient.surcharge.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prismaClient.surcharge.count({ where }),
  ]);

  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
}
