// app/api/seed/depot/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// allow either field (or both) to be updated
const DepotUpdateSchema = z
  .object({
    name:    z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.name !== undefined || data.address !== undefined, {
    message: "At least one of `name` or `address` must be provided to update",
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const updates = DepotUpdateSchema.parse(await req.json());

    const updated = await prismaClient.depot.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    // handle "not found" or other Prisma errors
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes("Record to update not found") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
