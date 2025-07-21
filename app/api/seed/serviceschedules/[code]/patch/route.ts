import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const UpdateServiceSchedule = z.object({
  description: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const data = UpdateServiceSchedule.parse(await req.json());
    const updated = await prismaClient.serviceSchedule.update({
      where: { code: params.code },
      data
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
