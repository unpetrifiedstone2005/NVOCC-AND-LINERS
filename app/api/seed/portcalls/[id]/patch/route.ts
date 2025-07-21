import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const UpdatePortCallSchema = z.object({
  portCode:   z.string().optional(),
  order:      z.number().int().min(1).optional(),
  eta:        z.string().optional(),
  etd:        z.string().optional(),
  vesselName: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let input;
  try {
    input = UpdatePortCallSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  const { id } = params;
  const existing = await prismaClient.portCall.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: `PortCall id "${id}" not found` },
      { status: 404 }
    );
  }

  const updated = await prismaClient.portCall.update({
    where: { id },
    data: {
      ...(input.portCode   !== undefined && { portCode:   input.portCode! }),
      ...(input.order      !== undefined && { order:      input.order! }),
      ...(input.eta        !== undefined && { eta:        input.eta!   ? new Date(input.eta!) : null }),
      ...(input.etd        !== undefined && { etd:        input.etd!   ? new Date(input.etd!) : null }),
      ...(input.vesselName !== undefined && { vesselName: input.vesselName! }),
    },
  });

  return NextResponse.json(updated);
}
