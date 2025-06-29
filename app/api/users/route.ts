import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const email = searchParams.get("email");
  const role = searchParams.get("role");

  const skip = (page - 1) * limit;
  const where: any = {};
  if (email) where.email = { contains: email, mode: "insensitive" };
  if (role) where.role = role;

  const [data, total] = await Promise.all([
    prismaClient.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    prismaClient.user.count({ where })
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
