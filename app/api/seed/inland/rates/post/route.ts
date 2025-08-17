// app/api/seed/inland/rates/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";
import { Prisma, InlandDirection, InlandMode, ContainerGroup } from "@prisma/client";

// ---------- helpers ----------
function asDateISO(v: string) {
  return new Date(v.length === 10 ? `${v}T00:00:00.000Z` : v);
}
function dec(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : (v as number);
  if (Number.isNaN(n)) return null;
  return new Prisma.Decimal(n);
}

// ---------- schema ----------
const RateSchema = z.object({
  zoneId: z.string().uuid(),
  portUnlocode: z.string().min(3),

  // use Prisma enums, not string unions
  direction: z.nativeEnum(InlandDirection),
  mode: z.nativeEnum(InlandMode),
  containerGroup: z.nativeEnum(ContainerGroup),

  containerTypeIsoCode: z.string().optional().nullable(),

  currency: z.string().default("USD"),
  basis: z.enum(["FLAT", "PER_KM", "BREAKS"]), // your Prisma field is String, so keep as string enum

  flatAmount: z.coerce.number().optional(),
  perKmAmount: z.coerce.number().optional(),
  minCharge: z.coerce.number().optional(),

  validFrom: z.string(),
  validTo: z.string().optional(),

  maxDistanceKm: z.coerce.number().int().optional(),
  maxWeightKg: z.coerce.number().int().optional(),

  breaks: z
    .array(
      z.object({
        breakType: z.enum(["WEIGHT", "DISTANCE"]),
        fromValue: z.coerce.number().int(),
        toValue: z.coerce.number().int().optional(),
        amount: z.coerce.number(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = RateSchema.parse(body);

    // basis-specific guards (optional but helpful)
    if (v.basis === "FLAT" && v.flatAmount == null) {
      return NextResponse.json({ error: "flatAmount is required for FLAT basis" }, { status: 400 });
    }
    if (v.basis === "PER_KM" && v.perKmAmount == null) {
      return NextResponse.json({ error: "perKmAmount is required for PER_KM basis" }, { status: 400 });
    }
    if (v.basis === "BREAKS" && (!v.breaks || v.breaks.length === 0)) {
      return NextResponse.json({ error: "At least one break is required for BREAKS basis" }, { status: 400 });
    }

    const item = await prismaClient.inlandRate.create({
      data: {
        zoneId: v.zoneId,
        portUnlocode: v.portUnlocode.toUpperCase(),
        direction: v.direction,              // <-- now typed as InlandDirection
        mode: v.mode,                        // <-- InlandMode
        containerGroup: v.containerGroup,    // <-- ContainerGroup
        containerTypeIsoCode: v.containerTypeIsoCode || null,

        currency: v.currency.toUpperCase(),
        basis: v.basis,

        flatAmount: dec(v.flatAmount),
        perKmAmount: dec(v.perKmAmount),
        minCharge: dec(v.minCharge),

        validFrom: asDateISO(v.validFrom),
        validTo: v.validTo ? asDateISO(v.validTo) : null,

        maxDistanceKm: v.maxDistanceKm ?? null,
        maxWeightKg: v.maxWeightKg ?? null,

        breaks: v.breaks.length
          ? {
              create: v.breaks.map((b) => ({
                breakType: b.breakType,
                fromValue: b.fromValue,
                toValue: b.toValue ?? null,
                amount: dec(b.amount)!,
              })),
            }
          : undefined,
      },
      include: { zone: true, port: true, containerType: true, breaks: true },
    });

    return NextResponse.json({ item });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate: (zone, port, direction, mode, group, type, validFrom) already exists." },
        { status: 409 }
      );
    }
    if (err?.code === "P2003") {
      return NextResponse.json(
        { error: "Foreign key missing: ensure zone, port, and container type exist." },
        { status: 400 }
      );
    }
    const msg =
      err?.issues?.map?.((i: any) => `${i.path?.join(".")}: ${i.message}`).join("; ") ||
      err?.message ||
      "Failed to create inland rate";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
