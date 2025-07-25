import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const CreateVoyageSchema = z.object({
  serviceId: z.string().uuid(), // ✅ Now expects serviceId
  voyageNumber: z.string().optional(),
  departure: z.string().datetime(),
  arrival: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  let input;
  try {
    input = CreateVoyageSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // ✅ ensure service exists using serviceId
  const svc = await prismaClient.serviceSchedule.findUnique({
    where: { id: input.serviceId }
  });

  if (!svc) {
    return NextResponse.json(
      { error: `serviceId "${input.serviceId}" not found` },
      { status: 400 }
    );
  }

  // ✅ create voyage with FK only
  const voyage = await prismaClient.voyage.create({
    data: {
      serviceId: input.serviceId,
      voyageNumber: input.voyageNumber,
      departure: new Date(input.departure),
      arrival: input.arrival ? new Date(input.arrival) : undefined,
    },
    include: {
      service: true, // ✅ include service to return code
    },
  });

  return NextResponse.json(voyage, { status: 201 });
}
