// app/api/seed/voyages/[voyageId]/patch/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const PatchVoyageSchema = z
  .object({
    voyageNumber: z.string().optional(),
    departure:    z.string().optional(),
    arrival:      z.string().optional(),
  })
  .passthrough();  // allow extra keys if needed

export async function PATCH(
  request: Request,
  context: { params: { voyageId: string } } | Promise<{ params: { voyageId: string } }>
) {
  // Await params as required by Next.js App Router
  const { params } = await context;
  const voyageId = params.voyageId;

  console.log("[PATCH] voyageId:", voyageId);

  // Validate voyageId format (UUID)
  if (!/^[0-9a-fA-F\-]{36}$/.test(voyageId)) {
    console.log("[PATCH] Invalid voyageId format:", voyageId);
    return NextResponse.json({ error: "Invalid voyageId" }, { status: 400 });
  }

  // Parse JSON body from request
  let body;
  try {
    body = await request.json();
    console.log("[PATCH] Raw request body:", body);
  } catch (err) {
    console.log("[PATCH] Error parsing JSON body:", err);
    throw err;
  }

  // Validate request body with Zod schema
  let updates;
  try {
    updates = PatchVoyageSchema.parse(body);
    console.log("[PATCH] Updates after schema validation:", updates);
  } catch (err) {
    if (err instanceof ZodError) {
      console.log("[PATCH] Zod validation errors:", err.flatten().fieldErrors);
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    console.log("[PATCH] Unexpected schema error:", err);
    throw err;
  }

  // Check if voyage exists in database
  const existing = await prismaClient.voyage.findUnique({ where: { id: voyageId } });
  if (!existing) {
    console.log("[PATCH] Voyage not found:", voyageId);
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  // Update voyage record with provided fields
  let updated;
  try {
    updated = await prismaClient.voyage.update({
      where: { id: voyageId },
      data: {
        ...(updates.voyageNumber !== undefined && { voyageNumber: updates.voyageNumber }),
        ...(updates.departure !== undefined && { departure: new Date(updates.departure) }),
        ...(updates.arrival !== undefined && { arrival: new Date(updates.arrival) }),
      },
    });
    console.log("[PATCH] Updated voyage data:", updated);
  } catch (err) {
    console.log("[PATCH] Error updating voyage:", err);
    throw err;
  }

  return NextResponse.json(updated, { status: 200 });
}
