import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const CreateVoyageSchema = z.object({
  serviceCode: z.string().min(1),
  voyageNumber: z.string().optional(),
  departure: z.string().datetime(),
  arrival: z.string().datetime().optional(),
  portCalls: z.array(z.object({
    sequence: z.number(),
    portCode: z.string().min(1),
    callType: z.string().optional(),
    eta: z.string().datetime().optional(),
    etd: z.string().datetime().optional(),
    vesselName: z.string().optional()
  })).optional()
});

export async function POST(req: NextRequest) {
  let input;
  try {
    input = CreateVoyageSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // ✅ find service by code
  const svc = await prismaClient.serviceSchedule.findUnique({
    where: { code: input.serviceCode }
  });

  if (!svc) {
    return NextResponse.json(
      { error: `serviceCode "${input.serviceCode}" not found` },
      { status: 400 }
    );
  }

  // ✅ create voyage
  const voyage = await prismaClient.voyage.create({
    data: {
      serviceId: svc.id,
      voyageNumber: input.voyageNumber,
      departure: new Date(input.departure),
      arrival: input.arrival ? new Date(input.arrival) : undefined,
      portCalls: input.portCalls ? {
        create: input.portCalls.map(pc => ({
          portCode: pc.portCode,
          order: pc.sequence,
          eta: pc.eta ? new Date(pc.eta) : null,
          etd: pc.etd ? new Date(pc.etd) : null,
          mode: pc.callType || undefined,
          vesselName: pc.vesselName || undefined,
        }))
      } : undefined
    },
    include: { service: true, portCalls: true }
  });

  return NextResponse.json(voyage, { status: 201 });
}
