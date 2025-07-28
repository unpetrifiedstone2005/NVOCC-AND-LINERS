// app/api/seed/voyages/[voyageId]/patch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const PatchVoyageSchema = z
  .object({
    voyageNumber: z.string().min(1).optional(),
    departure: z
      .string()
      .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid departure date" })
      .optional(),
    arrival: z
      .string()
      .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid arrival date" })
      .optional(),
    vesselName: z.string().min(1).optional(),
  })
  // if both dates present, departure must be before arrival
  .refine(
    (data) =>
      !data.departure ||
      !data.arrival ||
      new Date(data.departure) < new Date(data.arrival),
    { message: "Departure must be before arrival", path: ["arrival"] }
  );

export async function PATCH(
  request: NextRequest,
  { params }: { params: { voyageId: string } }
) {
  const { voyageId } =  await params;

  // 1) Validate voyageId format
  if (!/^[0-9a-fA-F-]{36}$/.test(voyageId)) {
    return NextResponse.json({ error: "Invalid voyageId" }, { status: 400 });
  }

  // 2) Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // 3) Validate & coerce inputs
  let updates: z.infer<typeof PatchVoyageSchema>;
  try {
    updates = PatchVoyageSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // 4) Ensure voyage exists
  const existing = await prismaClient.voyage.findUnique({
    where: { id: voyageId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  // 5) Apply update
  try {
    const updated = await prismaClient.voyage.update({
      where: { id: voyageId },
      data: {
        ...(updates.voyageNumber !== undefined && {
          voyageNumber: updates.voyageNumber,
        }),
        ...(updates.departure !== undefined && {
          departure: new Date(updates.departure),
        }),
        ...(updates.arrival !== undefined && {
          arrival: new Date(updates.arrival),
        }),
        ...(updates.vesselName !== undefined && {
          vesselName: updates.vesselName,
        }),
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    // handle unique‐constraint on voyageNumber
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Voyage number already exists" },
        { status: 409 }
      );
    }
    console.error("PATCH /voyages/[voyageId] error:", err);
    return NextResponse.json(
      { error: "Failed to update voyage" },
      { status: 500 }
    );
  }
}
