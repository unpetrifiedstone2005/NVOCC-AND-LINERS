import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const documentNo = searchParams.get("documentNo");
  const documentId = searchParams.get("documentId");
  const bookingId = searchParams.get("bookingId");
  const status = searchParams.get("status");
  const createdBy = searchParams.get("createdBy");
  const sortBy = searchParams.get("sortBy") || "documentNo";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const skip = (page - 1) * limit;
  const where: any = {};
  if (documentNo) where.documentNo = documentNo;
  if (documentId) where.documentId = documentId;
  if (bookingId) where.bookingId = bookingId;
  if (status) where.status = status;
  if (createdBy) where.createdBy = createdBy;

  const [data, total] = await Promise.all([
    prismaClient.bLDraft.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prismaClient.bLDraft.count({ where }),
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
