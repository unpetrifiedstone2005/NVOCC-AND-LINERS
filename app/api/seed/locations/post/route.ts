// /api/seed/locations/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { LocationType } from "@prisma/client";

// Accept UI-ish shape (code/unlocode + free-form type string)
const RawItemSchema = z.object({
  code:     z.string().trim().optional().nullable(),     // UI alias for unlocode
  unlocode: z.string().trim().optional().nullable(),
  name:     z.string().trim().min(1, "name required"),
  city:     z.string().trim().optional().nullable(),
  country:  z.string().trim().optional().nullable(),
  type:     z.string().trim().optional().nullable(),     // "PORT"|"SEAPORT"|"INLAND"|"INLAND_CITY"|"TERMINAL"|"DEPOT"|ICD/CFS/WAREHOUSE
});
const BulkSchema = z.union([RawItemSchema, z.array(RawItemSchema).min(1)]);
type RawItem = z.infer<typeof RawItemSchema>;

/** Map loose incoming string → strict Prisma enum (no inference from code). */
function mapType(raw: string | null | undefined): LocationType {
  const t = raw?.toUpperCase();
  if (t === "SEAPORT" || t === "PORT") return LocationType.SEAPORT;
  if (t === "INLAND" || t === "INLAND_CITY" || t === "CITY") return LocationType.INLAND_CITY;
  if (t === "TERMINAL" || t === "SMDG") return LocationType.TERMINAL;
  if (t === "DEPOT" || t === "ICD" || t === "CFS" || t === "WAREHOUSE" || t === "RAMP") return LocationType.DEPOT;
  return LocationType.INLAND_CITY; // sensible default
}

/** Normalize one item to DB shape */
function normalize(r: RawItem) {
  const codeCandidate = (r.unlocode ?? r.code ?? "").trim().toUpperCase();
  const unlocode = codeCandidate === "" ? null : codeCandidate;
  return {
    unlocode,
    name: r.name.trim(),
    city: r.city?.trim() || null,
    country: r.country?.trim()?.toUpperCase() || null,
    type: mapType(r.type), // ← no hasCode here
  };
}

export async function POST(req: NextRequest) {
  const onConflict = (new URL(req.url).searchParams.get("onConflict") || "skip").toLowerCase();
  if (!["skip", "update"].includes(onConflict)) {
    return NextResponse.json({ error: "onConflict must be 'skip' or 'update'" }, { status: 400 });
  }

  // Parse and normalize
  let items: ReturnType<typeof normalize>[];
  try {
    const body = await req.json();
    const parsed = BulkSchema.parse(body);
    items = (Array.isArray(parsed) ? parsed : [parsed]).map(normalize);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate: code rules per type
  const errors: Record<string, string[]> = {};
  items.forEach((it, idx) => {
    const needsCode = it.type === LocationType.SEAPORT || it.type === LocationType.INLAND_CITY;

    if (needsCode) {
      if (!it.unlocode) {
        (errors[`[${idx}].unlocode`] ||= []).push("UN/LOCODE is required for SEAPORT/INLAND_CITY");
      } else if (!/^[A-Z0-9]{5}$/.test(it.unlocode)) {
        (errors[`[${idx}].unlocode`] ||= []).push("UN/LOCODE must be 5 alphanumerics (e.g., SGSIN)");
      }
    } else {
      // For TERMINAL/DEPOT, unlocode is optional; if provided, still validate
      if (it.unlocode && !/^[A-Z0-9]{5}$/.test(it.unlocode)) {
        (errors[`[${idx}].unlocode`] ||= []).push("If provided, UN/LOCODE must be 5 alphanumerics");
      }
    }
  });
  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Deduplicate within payload (include type in the key so facilities/inland cities don't collide)
  const keyOf = (x: (typeof items)[number]) =>
    x.unlocode ?? `${x.type}|${x.name}|${x.city ?? ""}|${x.country ?? ""}`.toUpperCase();

  const dedup = new Map<string, (typeof items)[number]>();
  for (const i of items) dedup.set(keyOf(i), i);
  const deduped = Array.from(dedup.values());

  const withCode    = deduped.filter(d => d.unlocode);
  const withoutCode = deduped.filter(d => !d.unlocode);

  if (onConflict === "update") {
    const results = { created: 0, updated: 0 };

    await prismaClient.$transaction(async (tx) => {
      // With UN/LOCODE → upsert by unlocode
      for (const d of withCode) {
        const exists = await tx.location.findUnique({ where: { unlocode: d.unlocode! } });
        await tx.location.upsert({
          where:  { unlocode: d.unlocode! },
          create: d,
          update: { name: d.name, city: d.city, country: d.country, type: d.type },
        });
        results[exists ? "updated" : "created"]++;
      }

      // Without UN/LOCODE → match by (type, name, city, country) where unlocode IS NULL
      for (const d of withoutCode) {
        const existing = await tx.location.findFirst({
          where: { unlocode: null, type: d.type, name: d.name, city: d.city, country: d.country },
          select: { id: true },
        });
        if (existing) {
          await tx.location.update({
            where: { id: existing.id },
            data:  { name: d.name, city: d.city, country: d.country, type: d.type },
          });
          results.updated++;
        } else {
          await tx.location.create({ data: d });
          results.created++;
        }
      }
    });

    return NextResponse.json(
      { mode: "update", ...results, totalProcessed: deduped.length },
      { status: 200 }
    );
  }

  // onConflict === "skip"
  const existing = withCode.length
    ? await prismaClient.location.findMany({
        where: { unlocode: { in: withCode.map(x => x.unlocode!) } },
        select: { unlocode: true },
      })
    : [];
  const existSet = new Set(existing.map(e => e.unlocode!));

  const toCreateWithCode    = withCode.filter(x => !existSet.has(x.unlocode!));
  const toCreateWithoutCode = withoutCode;

  let createdCount = 0;

  if (toCreateWithCode.length) {
    const { count } = await prismaClient.location.createMany({
      data: toCreateWithCode,
      skipDuplicates: true,
    });
    createdCount += count;
  }
  if (toCreateWithoutCode.length) {
    const { count } = await prismaClient.location.createMany({
      data: toCreateWithoutCode,
      skipDuplicates: true,
    });
    createdCount += count;
  }

  return NextResponse.json(
    { mode: "skip", createdCount, skippedCodes: Array.from(existSet), totalProcessed: deduped.length },
    { status: createdCount ? 201 : 200 }
  );
}
