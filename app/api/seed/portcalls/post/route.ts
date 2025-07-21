import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const CreatePortCallSchema = z.object({
  voyageId:   z.string().uuid(),
  portCode:   z.string().min(1),
  order:      z.number().int().min(1),
  eta:        z.string().optional(),
  etd:        z.string().optional(),
  vesselName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let input;
  try {
    input = CreatePortCallSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // ensure parent voyage exists
  const voyage = await prismaClient.voyage.findUnique({
    where: { id: input.voyageId },
  });
  if (!voyage) {
    return NextResponse.json(
      { error: `voyageId "${input.voyageId}" not found` },
      { status: 400 }
    );
  }

  const portCall = await prismaClient.portCall.create({
    data: {
      voyageId: input.voyageId,
      portCode: input.portCode,
      order:    input.order,
      ...(input.eta        ? { eta:  new Date(input.eta) } : {}),
      ...(input.etd        ? { etd:  new Date(input.etd) } : {}),
      ...(input.vesselName ? { vesselName: input.vesselName } : {}),
    },
  });

  return NextResponse.json(portCall, { status: 201 });
}
