// app/api/seed/serviceschedules/[scheduleId]/voyages/[voyageId]/portcalls/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { scheduleId: string; voyageId: string } }
) {
  const { voyageId } = await params;
  const url = new URL(req.url);

  // Optional query params for filtering and pagination
  const portCode = url.searchParams.get("portCode");
  const order = url.searchParams.get("order");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);

  // Filtering object for Prisma
  const where: any = { voyageId };
  if (portCode) where.portCode = portCode;
  if (order) where.order = Number(order);

  const total = await prismaClient.portCall.count({ where });

  const portCalls = await prismaClient.portCall.findMany({
    where,
    orderBy: { order: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    portCalls,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
