import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateVesselSchema = z.object({
  name: z.string().min(1, "Vessel name is required"),
  imo: z.string().optional(),
  mmsi: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CreateVesselSchema.parse(body);

    // Check for duplicate IMO/MMSI
    if (data.imo) {
      const existingByIMO = await prismaClient.vessel.findFirst({
        where: { imo: data.imo },
      });
      if (existingByIMO) {
        return NextResponse.json(
          { error: "Vessel with this IMO already exists" },
          { status: 409 }
        );
      }
    }

    if (data.mmsi) {
      const existingByMMSI = await prismaClient.vessel.findFirst({
        where: { mmsi: data.mmsi },
      });
      if (existingByMMSI) {
        return NextResponse.json(
          { error: "Vessel with this MMSI already exists" },
          { status: 409 }
        );
      }
    }

    const vessel = await prismaClient.vessel.create({
      data: {
        name: data.name,
        imo: data.imo,
        mmsi: data.mmsi
      },
    });

    return NextResponse.json(vessel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500 }
    );
  }
}
