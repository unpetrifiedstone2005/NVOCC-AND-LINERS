// File: app/api/seed/locations/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z } from "zod";

// UI type literals
type UiLocationType = "PORT" | "INLAND";

// Map DB enum -> UI literal
function dbToUiType(dbType: string): UiLocationType {
  if (dbType === "SEAPORT") return "PORT";
  if (dbType === "INLAND_CITY") return "INLAND";
  // For TERMINAL/DEPOT, the UI only knows "INLAND" vs "PORT".
  return "INLAND";
}

// Map UI literal -> DB enum for filtering
function uiToDbType(ui?: string): "SEAPORT" | "INLAND_CITY" | undefined {
  if (!ui) return undefined;
  const t = ui.toUpperCase();
  if (t === "PORT") return "SEAPORT";
  if (t === "INLAND") return "INLAND_CITY";
  return undefined;
}

const QuerySchema = z.object({
  page:     z.string().optional(),
  limit:    z.string().optional(),
  code:     z.string().optional(),     // UI may send ?code=
  unlocode: z.string().optional(),     // or ?unlocode=
  name:     z.string().optional(),
  type:     z.enum(["PORT", "INLAND"]).optional(),
});

export async function GET(req: NextRequest) {
  // Parse & sanitize query
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    page:     url.searchParams.get("page") ?? undefined,
    limit:    url.searchParams.get("limit") ?? undefined,
    code:     url.searchParams.get("code") ?? undefined,
    unlocode: url.searchParams.get("unlocode") ?? undefined,
    name:     url.searchParams.get("name") ?? undefined,
    type:     url.searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const q = parsed.data;

  // Pagination
  const page  = Math.max(1, Number(q.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20) || 20));
  const skip  = (page - 1) * limit;

  // Filters
  const codeFilter = (q.unlocode ?? q.code)?.trim();
  const nameFilter = q.name?.trim();
  const dbType = uiToDbType(q.type);

  const where: any = {};

  if (codeFilter) {
    where.unlocode = { contains: codeFilter, mode: "insensitive" };
  }
  if (nameFilter) {
    // match either name or city for convenience
    where.OR = [
      { name: { contains: nameFilter, mode: "insensitive" } },
      { city: { contains: nameFilter, mode: "insensitive" } },
    ];
  }
  if (dbType) {
    where.type = dbType;
  }

  // Count + page
  const [total, rows] = await Promise.all([
    prismaClient.location.count({ where }),
    prismaClient.location.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ name: "asc" }, { unlocode: "asc" }],
      select: {
        id: true,
        unlocode: true,
        name: true,
        city: true,
        country: true,
        type: true, // DB enum
        // ✅ include door fields
        doorPickupAllowed: true,
        doorDeliveryAllowed: true,
        doorNotes: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Map DB -> UI shape your component expects
  const items = rows.map(r => ({
    id: r.id,
    unlocode: r.unlocode,     // keep null if null
    name: r.name,
    city: r.city,
    country: r.country,
    type: dbToUiType(String(r.type)) as UiLocationType,

    // ✅ pass through the door fields
    doorPickupAllowed: r.doorPickupAllowed,
    doorDeliveryAllowed: r.doorDeliveryAllowed,
    doorNotes: r.doorNotes,
  }));

  return NextResponse.json({
    items,
    totalPages,
    currentPage: page,
  });
}
