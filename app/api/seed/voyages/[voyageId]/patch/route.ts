// app/api/voyages/[voyageId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const PatchVoyageSchema = z.object({
  voyageNumber: z.string().optional(),
  departure:    z.string().datetime().optional(),
  arrival:      z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { voyageId: string } }
) {
  const { voyageId } = params;
  if (!/^[0-9a-fA-F\-]{36}$/.test(voyageId)) {
    return NextResponse.json({ error: "Invalid voyageId" }, { status: 400 });
  }

  let updates;
  try {
    updates = PatchVoyageSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  const existing = await prismaClient.voyage.findUnique({
    where: { id: voyageId }
  });
  if (!existing) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  const updated = await prismaClient.voyage.update({
    where: { id: voyageId },
    data: {
      ...(updates.voyageNumber !== undefined && { voyageNumber: updates.voyageNumber }),
      ...(updates.departure    !== undefined && { departure:    new Date(updates.departure) }),
      ...(updates.arrival      !== undefined && { arrival:      new Date(updates.arrival) }),
    }
  });

  return NextResponse.json(updated, { status: 200 });
}
