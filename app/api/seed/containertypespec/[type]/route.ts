import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// Partial schema for PATCH (all fields optional)
const PatchContainerTypeSpecSchema = z.object({
  lengthMm: z.number().int().positive().optional(),
  widthMm: z.number().int().positive().optional(),
  heightMm: z.number().int().positive().optional(),
  maxStackWeightKg: z.number().int().positive().optional(),
  tareWeightKg: z.number().int().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const data = PatchContainerTypeSpecSchema.parse(await req.json());
    const { type } = params;

    // Check existence
    const exists = await prismaClient.containerTypeSpec.findUnique({
      where: { type },
    });
    if (!exists) {
      return NextResponse.json({ error: "Container type not found." }, { status: 404 });
    }

    // Update
    const updated = await prismaClient.containerTypeSpec.update({
      where: { type },
      data,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
