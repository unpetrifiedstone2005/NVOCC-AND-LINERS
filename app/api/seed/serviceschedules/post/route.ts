import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const CreateServiceSchedule = z.object({
  code:        z.string(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = CreateServiceSchedule.parse(await req.json());
    const schedule = await prismaClient.serviceSchedule.create({
      data: body
    });
    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
