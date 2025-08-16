import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

// /api/seed/serviceschedules/:scheduleId/voyages/:voyageId/cutoffs/get
export async function GET(
  req: Request,
  { params }: { params: { scheduleId: string; voyageId: string } }
) {
  const { scheduleId, voyageId } = await params;

  // Optional: ensure the voyage belongs to the schedule
  const voyage = await prismaClient.voyage.findFirst({
    where: { id: voyageId, serviceId: scheduleId },
    select: { id: true },
  });
  if (!voyage) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? undefined; // "ERD"|"FCL_GATEIN"|"VGM"|"DOC_SI"
  const fsParam = url.searchParams.get("facilityScheme"); // "SMDG"|"BIC"|"INTERNAL"|"null"
  const fcParam = url.searchParams.get("facilityCode");   // "XYZ"|"null"
  const sort = (url.searchParams.get("sort") ?? "at") as "at" | "kind";

  const where: any = { voyageId };
  if (kind) where.kind = kind;
  if (fsParam === "null") where.facilityScheme = null;
  else if (fsParam) where.facilityScheme = fsParam;

  if (fcParam === "null") where.facilityCode = null;
  else if (fcParam) where.facilityCode = fcParam;

  try {
    const rows = await prismaClient.voyageCutoff.findMany({
      where,
      orderBy: sort === "kind" ? [{ kind: "asc" }, { at: "asc" }] : [{ at: "asc" }],
    });

    return NextResponse.json({ cutoffs: rows });
  } catch (err) {
    console.error("GET voyage cutoffs failed:", err);
    return NextResponse.json({ error: "Failed to load cutoffs" }, { status: 500 });
  }
}
