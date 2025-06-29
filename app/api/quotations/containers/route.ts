import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const id = searchParams.get("id");
  const quotationId = searchParams.get("quotationId");
  const type = searchParams.get("type");
  const sortBy = searchParams.get("sortBy") || "id"; // Default to id
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const skip = (page - 1) * limit;
  const where: any = {};
  if (id) where.id = id;
  if (quotationId) where.quotationId = quotationId;
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    prismaClient.quotationContainer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prismaClient.quotationContainer.count({ where })
  ]);

  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  });
}
