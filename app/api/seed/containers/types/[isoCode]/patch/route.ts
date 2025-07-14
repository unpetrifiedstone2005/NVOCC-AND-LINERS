import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { ContainerGroup } from "@prisma/client";

const PatchContainerTypeSchema = z.object({
  name:              z.string().min(1).optional(),
  lengthMm:          z.number().int().positive().optional(),
  widthMm:           z.number().int().positive().optional(),
  heightMm:          z.number().int().positive().optional(),
  maxStackWeightKg:  z.number().int().positive().optional(),
  tareWeightKg:      z.number().int().positive().optional(),
  maxGrossWeightKg:  z.number().int().positive().optional(),
  group:             z.nativeEnum(ContainerGroup).optional(),
  teuFactor:         z.number().positive().optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: "At least one field must be provided",
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { isoCode: string } }
) {
  try {
    const data = PatchContainerTypeSchema.parse(await request.json());
    const updated = await prismaClient.containerType.update({
      where: { isoCode: params.isoCode },
      data
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
