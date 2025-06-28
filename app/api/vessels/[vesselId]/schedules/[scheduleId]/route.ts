import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateScheduleSchema = z.object({
  portOfCallId: z.string().optional(),
  voyageNumber: z.string().optional(),
  etd: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  status: z.string().optional(),
  operationType: z.string().optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { vesselId: string; scheduleId: string } }
) {
  try {
    const body = await req.json();
    const data = UpdateScheduleSchema.parse(body);

    const schedule = await prismaClient.vesselSchedule.update({
      where: { id: params.scheduleId },
      data,
    });

    return NextResponse.json(schedule, { status: 200 });
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
