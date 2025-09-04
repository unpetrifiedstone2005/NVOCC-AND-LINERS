import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z, ZodError } from "zod";

const PatchVesselContainerSchema = z.object({
  containerNumber: z.string().optional(),
  vesselNumber: z.string().optional(),
  vesselName: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = PatchVesselContainerSchema.parse(body);

    // remove undefined keys
    const updatePayload: Record<string, any> = {};
    if (data.vesselNumber) updatePayload.vesselNumber = data.vesselNumber;
    if (data.vesselName) updatePayload.vesselName = data.vesselName;

    if (data.containerNumber) {
      // check container exists in Container table
      const exists = await prismaClient.container.findUnique({
        where: { containerNo: data.containerNumber },
      });
      if (!exists) {
        return NextResponse.json(
          { error: `Container ${data.containerNumber} not found.` },
          { status: 400 }
        );
      }
      updatePayload.containerNumber = data.containerNumber;
    }

    const updated = await prismaClient.vesselContainer.update({
      where: { id: Number(params.id) },
      data: updatePayload,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error("PATCH /vesselcontainer failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}