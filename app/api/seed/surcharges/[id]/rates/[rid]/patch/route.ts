import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const UpdateRateSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function PATCH(
  req: Request,
  context : { params: { id: string; rid: string } }
) {
  try {

     const { params } = context;
  // If params is a promise, await it:
    const resolvedParams = await params;

   const body = UpdateRateSchema.parse(await req.json());
  const updated = await prismaClient.surchargeRate.update({
    where: { id: resolvedParams.rid },
    data:  { amount: parseFloat(body.amount) },
  });
  return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    // Prisma P2025 = “record not found”
    if ((e as any).code === "P2025") {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
