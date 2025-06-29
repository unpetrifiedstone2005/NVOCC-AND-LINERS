import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateVesselSchema = z.object({
  name: z.string().optional(),
  imo: z.string().optional(),
  mmsi: z.string().optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { vesselId: string } }
) {
  try {
    const body = await req.json();
    const data = UpdateVesselSchema.parse(body);

    const vessel = await prismaClient.vessel.update({
      where: { id: params.vesselId },
      data,
    });

    return NextResponse.json(vessel, { status: 200 });
  }  catch (error) {
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
