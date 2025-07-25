import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const UpdateServiceSchedule = z.object({
  code: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }   // 👈 params must be awaited
) {
  try {
    const { id } = await context.params;         // ✅ Await params
    const data = UpdateServiceSchedule.parse(await req.json());

    const updated = await prismaClient.serviceSchedule.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
