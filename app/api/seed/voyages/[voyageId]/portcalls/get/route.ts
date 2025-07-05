// File: app/api/voyages/[voyageId]/portcalls/route.ts

import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { voyageId: string } }
) {
  const { voyageId } = params;
  if (!voyageId) {
    return NextResponse.json({ error: "voyageId is required" }, { status: 400 });
  }

  const calls = await prismaClient.portCall.findMany({
    where: { voyageId },
    orderBy: { order: "asc" },
    select: {
      portCode:   true,
      mode:       true,
      etd:        true,
      eta:        true,
      vesselName: true,
      order:      true,
    },
  });

  return NextResponse.json({ data: calls });
}
