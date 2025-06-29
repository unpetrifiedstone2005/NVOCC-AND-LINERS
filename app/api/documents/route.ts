import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

// List the fields you want to allow as filters
const FILTERABLE_FIELDS = [
  "id",
  "type",
  "bookingId",
  "quotationId",
  "invoiceId",
  "uploadedAt",
  "userId" // Add this if you have a userId/createdBy field in your Document model
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = searchParams.get("sortBy") || "uploadedAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  // Build filters dynamically
  const where: any = {};
  for (const field of FILTERABLE_FIELDS) {
    const value = searchParams.get(field);
    if (value !== null) {
      // For date fields, you might want to add range support
      if (field === "uploadedAt") {
        // Example: uploadedAt_gte, uploadedAt_lte
        const gte = searchParams.get("uploadedAt_gte");
        const lte = searchParams.get("uploadedAt_lte");
        if (gte || lte) {
          where.uploadedAt = {};
          if (gte) where.uploadedAt.gte = new Date(gte);
          if (lte) where.uploadedAt.lte = new Date(lte);
          continue;
        }
      }
      where[field] = value;
    }
  }

  // Fetch data and total count
  const [data, total] = await Promise.all([
    prismaClient.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prismaClient.document.count({ where }),
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
