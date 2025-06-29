import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const id = searchParams.get("id");
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const sortBy = searchParams.get("sortBy") || "id";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const skip = (page - 1) * limit;
  const where: any = {};
  if (id) where.id = id;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.bookingDate = {};
    if (startDate) where.bookingDate.gte = new Date(startDate);
    if (endDate) where.bookingDate.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    prismaClient.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prismaClient.booking.count({ where })
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
