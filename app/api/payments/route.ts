import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const id = searchParams.get("id");
  const invoiceId = searchParams.get("invoiceId");
  const bookingId = searchParams.get("bookingId");
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const method = searchParams.get("method");
  const sortBy = searchParams.get("sortBy") || "id";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const skip = (page - 1) * limit;
  const where: any = {};
  if (id) where.id = id;
  if (invoiceId) where.invoiceId = invoiceId;
  if (bookingId) where.bookingId = bookingId;
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (method) where.method = method;

  const [data, total] = await Promise.all([
    prismaClient.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { invoice: true }, // or other relations as needed
    }),
    prismaClient.payment.count({ where }),
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
