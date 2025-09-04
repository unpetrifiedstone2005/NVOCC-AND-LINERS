import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Rows must be an array" }, { status: 400 });
    }

    const results: { success: any[]; skipped: any[] } = { success: [], skipped: [] };

    for (const row of rows) {
      const { container_number, vessel_number, vessel_name } = row;

      // 1) validate required fields
      if (!container_number || !vessel_number || !vessel_name) {
        results.skipped.push({ row, reason: "Missing required fields" });
        continue;
      }

      // 2) check if container exists in Container table
      const exists = await prismaClient.container.findUnique({
        where: { containerNo: container_number },
      });

      if (!exists) {
        results.skipped.push({ row, reason: "Container does not exist" });
        continue;
      }

      // 3) insert into VesselContainer model
      const inserted = await prismaClient.vesselContainer.create({
        data: {
          containerNumber: container_number, // ✅ matches Prisma schema field
          vesselNumber: vessel_number,
          vesselName: vessel_name,
          dateTime: new Date(),
        },
      });

      results.success.push(inserted);
    }

    return NextResponse.json(results, { status: 201 });
  } catch (err) {
    console.error("Bulk import failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}