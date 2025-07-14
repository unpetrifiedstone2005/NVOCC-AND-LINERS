import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { ContainerGroup } from "@prisma/client";

const CreateContainerTypeSchema = z.object({
  isoCode:           z.string(),
  name:              z.string(),
  lengthMm:          z.number().int().positive(),
  widthMm:           z.number().int().positive(),
  heightMm:          z.number().int().positive(),
  maxStackWeightKg:  z.number().int().positive(),
  tareWeightKg:      z.number().int().positive(),
  maxGrossWeightKg:  z.number().int().positive(),
  group:             z.nativeEnum(ContainerGroup),
  teuFactor:         z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = CreateContainerTypeSchema.parse(await request.json());
    const ct = await prismaClient.containerType.create({ data: payload });
    return NextResponse.json(ct, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
