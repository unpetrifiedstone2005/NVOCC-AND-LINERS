import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const CreateVesselContainerSchema = z.object({
  containerNumber: z.string().min(1),
  vesselNumber:    z.string().min(1),
  vesselName:      z.string().min(1),
  dateTime:        z.string().datetime()
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const payload = { ...raw };

    // strip empty strings
    for (const key of ["vesselName", "vesselNumber", "containerNumber"]) {
      if (payload[key] === "") delete payload[key];
    }

    const data = CreateVesselContainerSchema.parse(payload);

    const vesselContainer = await prismaClient.vesselContainer.create({
      data: {
        containerNumber: data.containerNumber,
        vesselNumber:    data.vesselNumber,
        vesselName:      data.vesselName,
        dateTime:        new Date(data.dateTime),
      },
    });

    return NextResponse.json(vesselContainer, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error("POST /vessel-containers failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}