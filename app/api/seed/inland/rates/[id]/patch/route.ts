// app/api/seed/inland/rates/[id]/patch/route.ts
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
const PatchSchema = z
  .object({
    zoneId: z.string().uuid().optional(),
    portUnlocode: z.string().min(3).optional(),
    direction: z.nativeEnum(InlandDirection).optional(),
    mode: z.nativeEnum(InlandMode).optional(),
    containerGroup: z.nativeEnum(ContainerGroup).optional(),
    containerTypeIsoCode: z.string().optional().nullable(),
    currency: z.string().optional(),
    basis: z.enum(["FLAT", "PER_KM", "BREAKS"]).optional(),
    flatAmount: z.coerce.number().optional(),
    perKmAmount: z.coerce.number().optional(),
    minCharge: z.coerce.number().optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional().nullable(),
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
      .optional(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const v = PatchSchema.parse(body);

    const data: any = {};

    if (v.zoneId) data.zoneId = v.zoneId;
    if (v.portUnlocode) data.portUnlocode = v.portUnlocode.toUpperCase();
    if (v.direction) data.direction = v.direction;
    if (v.mode) data.mode = v.mode;
    if (v.containerGroup) data.containerGroup = v.containerGroup;
    if ("containerTypeIsoCode" in v)
      data.containerTypeIsoCode = v.containerTypeIsoCode || null;

    if (v.currency) data.currency = v.currency.toUpperCase();
    if (v.basis) data.basis = v.basis;
    if ("flatAmount" in v) data.flatAmount = dec(v.flatAmount);
    if ("perKmAmount" in v) data.perKmAmount = dec(v.perKmAmount);
    if ("minCharge" in v) data.minCharge = dec(v.minCharge);

    if (v.validFrom) data.validFrom = asDateISO(v.validFrom);
    if ("validTo" in v)
      data.validTo = v.validTo ? asDateISO(v.validTo) : null;

    if ("maxDistanceKm" in v) data.maxDistanceKm = v.maxDistanceKm ?? null;
    if ("maxWeightKg" in v) data.maxWeightKg = v.maxWeightKg ?? null;

    // If breaks provided → wipe & recreate
    if (v.breaks) {
      data.breaks = {
        deleteMany: {}, // delete existing
        create: v.breaks.map((b) => ({
          breakType: b.breakType,
          fromValue: b.fromValue,
          toValue: b.toValue ?? null,
          amount: dec(b.amount)!,
        })),
      };
    }

    const item = await prismaClient.inlandRate.update({
      where: { id: params.id },
      data,
      include: { zone: true, port: true, containerType: true, breaks: true },
    });

    return NextResponse.json({ item });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }
    const msg =
      err?.issues?.map?.((i: any) => `${i.path?.join(".")}: ${i.message}`).join("; ") ||
      err?.message ||
      "Failed to update inland rate";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
