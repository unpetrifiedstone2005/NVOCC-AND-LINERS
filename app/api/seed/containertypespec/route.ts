import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// Zod schema for input validation
const ContainerTypeSpecSchema = z.object({
  type: z.string().min(2),
  lengthMm: z.number().int().positive(),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  maxStackWeightKg: z.number().int().positive(),
  tareWeightKg: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const data = ContainerTypeSpecSchema.parse(await req.json());

    // Prevent duplicate type
    const exists = await prismaClient.containerTypeSpec.findUnique({
      where: { type: data.type },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Container type already exists." },
        { status: 409 }
      );
    }

    const created = await prismaClient.containerTypeSpec.create({ data });
    return NextResponse.json(created, { status: 201 });
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
