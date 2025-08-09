// File: app/api/seed/locations/[id]/patch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z, ZodError } from "zod";

// Keep this local string-union to avoid importing @prisma/client here
type DbLocationType = "SEAPORT" | "INLAND_CITY" | "TERMINAL" | "DEPOT";

// UI accepts only these two and we map them to DB enum
const RawPatchSchema = z.object({
  code:     z.string().trim().optional(),              // UI alias for unlocode
  unlocode: z.string().trim().optional().nullable(),
  name:     z.string().trim().optional(),
  city:     z.string().trim().optional().nullable(),
  country:  z.string().trim().optional().nullable(),
  type:     z.enum(["PORT","INLAND"]).optional(),      // UI: "PORT" | "INLAND"
});

// UI → DB enum mapping
function uiToDbType(t?: "PORT" | "INLAND"): DbLocationType | undefined {
  if (!t) return undefined;
  return t === "PORT" ? "SEAPORT" : "INLAND_CITY";
}

// normalize + light validation
function normalize(input: z.infer<typeof RawPatchSchema>) {
  const rawCode = input.code ?? input.unlocode;

  const nn = (v: string | null | undefined) =>
    v === undefined ? undefined : (v === null || v.trim() === "" ? null : v.trim());

  const mappedType = uiToDbType(input.type);

  const out = {
    unlocode: rawCode === undefined ? undefined : (nn(rawCode)?.toUpperCase() ?? null),
    name:     input.name?.trim(),
    city:     nn(input.city ?? undefined),
    country:  nn(input.country ?? undefined)?.toUpperCase()
               ?? (input.country === undefined ? undefined : null),
    type:     mappedType,
  } as {
    unlocode?: string | null;
    name?: string;
    city?: string | null;
    country?: string | null;
    type?: DbLocationType;
  };

  // If caller provided a non-null code, validate format
  if (out.unlocode !== undefined && out.unlocode !== null) {
    if (!/^[A-Z0-9]{5}$/.test(out.unlocode)) {
      throw new ZodError([{
        code: "custom",
        path: ["unlocode"],
        message: "UN/LOCODE must be 5 alphanumerics (e.g., SGSIN)",
      }]);
    }
  }

  return out;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // basic UUID guard (adjust if you use cuid/cuid2)
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid location id" }, { status: 400 });
  }

  // parse + normalize
  let data: ReturnType<typeof normalize>;
  try {
    const body = await req.json();
    const raw  = RawPatchSchema.parse(body);
    data = normalize(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // load current record
  const current = await prismaClient.location.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  // figure out what the result would be after patch
  const nextType = (data.type ?? (current.type as unknown as DbLocationType));
  const nextUnlocode =
    data.unlocode === undefined ? current.unlocode : data.unlocode;

  // Rule: city-level locations (SEAPORT or INLAND_CITY) must have a UN/LOCODE
  if ((nextType === "SEAPORT" || nextType === "INLAND_CITY") &&
      (nextUnlocode === null || !nextUnlocode)) {
    return NextResponse.json(
      { error: "UN/LOCODE is required when type is PORT/INLAND CITY" },
      { status: 422 }
    );
  }

  // build partial update object from provided keys only
  const updateData: Record<string, any> = {};
  for (const k of ["unlocode", "name", "city", "country", "type"] as const) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }

  try {
    const updated = await prismaClient.location.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.code === "P2002" && err?.meta?.target?.includes("unlocode")) {
      return NextResponse.json(
        { error: "Another location already uses this UN/LOCODE" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}
