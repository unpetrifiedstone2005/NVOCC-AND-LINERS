// app/api/voyages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const CreateVoyageSchema = z.object({
  serviceCode:  z.string().min(1),
  voyageNumber: z.string().optional(),
  departure:    z.string().datetime(),
  arrival:      z.string().datetime().optional(),
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

  // ensure service exists
  const svc = await prismaClient.serviceSchedule.findUnique({
    where: { code: input.serviceCode }
  });
  if (!svc) {
    return NextResponse.json(
      { error: `serviceCode "${input.serviceCode}" not found` },
      { status: 400 }
    );
  }

  const voyage = await prismaClient.voyage.create({
    data: {
      serviceCode:  input.serviceCode,
      voyageNumber: input.voyageNumber,
      departure:    new Date(input.departure),
      arrival:      input.arrival ? new Date(input.arrival) : undefined,
    }
  });

  return NextResponse.json(voyage, { status: 201 });
}
