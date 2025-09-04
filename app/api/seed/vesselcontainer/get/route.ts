import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("DEBUG: GET /vessel-containers called");

    // fetch all, latest first
    const vessels = await prismaClient.vesselContainer.findMany({
      orderBy: { dateTime: "desc" }, // ✅ use Prisma field name
    });

    console.log("DEBUG: Retrieved vesselContainers:", vessels.length);
    return NextResponse.json({ items: vessels }, { status: 200 });
  } catch (err) {
    console.error("DEBUG: Failed to fetch vesselContainers:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}