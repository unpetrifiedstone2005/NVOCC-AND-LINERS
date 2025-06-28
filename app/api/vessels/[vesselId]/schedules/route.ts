import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateScheduleSchema = z.object({
  portOfCallId: z.string().min(1, "Port ID is required"),
  voyageNumber: z.string().min(1, "Voyage number is required"),
  etd: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  status: z.string().optional(),
  operationType: z.string().min(1, "Operation type is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { vesselId: string } }
) {
  try {
    const body = await req.json();
    const data = CreateScheduleSchema.parse(body);

    // Check if vessel exists
    const vessel = await prismaClient.vessel.findUnique({
      where: { id: params.vesselId },
    });
    if (!vessel) {
      return NextResponse.json(
        { error: "Vessel not found" },
        { status: 404 }
      );
    }

    // Check if port exists
    const port = await prismaClient.port.findUnique({
      where: { id: data.portOfCallId },
    });
    if (!port) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      );
    }

    const schedule = await prismaClient.vesselSchedule.create({
      data: {
        vesselId: params.vesselId,
        portOfCallId: data.portOfCallId,
        voyageNumber: data.voyageNumber,
        etd: data.etd ? new Date(data.etd) : null,
        eta: data.eta ? new Date(data.eta) : null,
        status: data.status,
         operationType: data.operationType,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
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
