import { NextRequest, NextResponse } from "next/server";
import { prismaClient }             from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const url      = new URL(req.url);
  const voyageId = url.searchParams.get("voyageId") || undefined;

  const items = await prismaClient.portCall.findMany({
    where:   voyageId ? { voyageId } : {},
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ items });
}
