import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const customer = searchParams.get("customer");
  const status = searchParams.get("status");

  const skip = (page - 1) * limit;
  const where: any = {};
  if (customer) where.customer = { contains: customer, mode: "insensitive" };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prismaClient.quotation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prismaClient.quotation.count({ where })
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
