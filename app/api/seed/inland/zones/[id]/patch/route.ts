// app/api/seed/inland/zones/[id]/patch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  id: z.string().uuid("Invalid zone id"),
});

// helpers
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = ParamsSchema.parse(params);
    const raw = await req.json();

    // Normalize input (accept array or CSV string for postalPrefixes)
    const normalized = {
      country: emptyToUndefined(raw.country),
      name: emptyToUndefined(raw.name),
      postalPrefixes: (() => {
        if (Array.isArray(raw.postalPrefixes)) {
          return raw.postalPrefixes
            .map((p: unknown) => String(p).trim())
            .filter(Boolean);
        }
        if (typeof raw.postalPrefixes === "string") {
          const s = raw.postalPrefixes.trim();
          if (!s) return [];
          return s.split(",").map((p: string) => p.trim()).filter(Boolean);
        }
        return undefined; // omit to keep unchanged
      })(),
      // send null to clear notes, omit (undefined) to keep as-is
      notes:
        typeof raw.notes === "undefined"
          ? undefined
          : emptyToNull(raw.notes),
    };

    // Schema (no refine; we’ll check after parse)
    const ZonePatchSchema = z.object({
      country: z.string().min(2, "country must be at least 2 chars").optional(),
      name: z.string().min(2, "name must be at least 2 chars").optional(),
      postalPrefixes: z.array(z.string()).optional(), // [] allowed: clears list
      notes: z.string().nullable().optional(),
    });

    const parsed = ZonePatchSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const v = parsed.data;

    // Build Prisma update
    const data: Prisma.InlandZoneUpdateInput = {};
    if (typeof v.country !== "undefined") data.country = v.country.trim();
    if (typeof v.name !== "undefined") data.name = v.name.trim();
    if (typeof v.postalPrefixes !== "undefined") {
      data.postalPrefixes = { set: v.postalPrefixes }; // Prisma list update
    }
    if (typeof v.notes !== "undefined") {
      // v.notes already null or string
      data.notes = v.notes ? v.notes.trim() : null;
    }

    // nothing to update after normalization?
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const item = await prismaClient.inlandZone.update({
      where: { id },
      data,
    });

    return NextResponse.json({ item }, { status: 200 });
  } catch (err: any) {
    // Zod (params) errors show up here too sometimes
    if (err?.issues) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A zone with the same unique fields already exists." },
        { status: 409 }
      );
    }
    console.error("PATCH /seed/inland/zones/:id error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
