// app/api/voyages/[voyageId]/portcalls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const CreatePortCallSchema = z.object({
  portCode:   z.string().min(1),
  order:      z.number().int().min(1),
  etd:        z.string().datetime().optional(),
  eta:        z.string().datetime().optional(),
  mode:       z.string().optional(),
  vesselName: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { voyageId: string } }
) {
  const { voyageId } = params;
  if (!/^[0-9a-fA-F\-]{36}$/.test(voyageId)) {
    return NextResponse.json({ error: "Invalid voyageId" }, { status: 400 });
  }

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

  // ensure voyage exists
  const voyage = await prismaClient.voyage.findUnique({
    where: { id: voyageId }
  });
  if (!voyage) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  const portCall = await prismaClient.portCall.create({
    data: {
      voyageId,
      portCode:   input.portCode,
      order:      input.order,
      etd:        input.etd ? new Date(input.etd) : undefined,
      eta:        input.eta ? new Date(input.eta) : undefined,
      mode:       input.mode,
      vesselName: input.vesselName,
    }
  });

  return NextResponse.json(portCall, { status: 201 });
}
