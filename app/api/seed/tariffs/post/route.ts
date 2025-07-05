// app/api/tariffs/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const TariffInput = z.object({
  serviceCode: z.string(),
  commodity:   z.string(),
  pol:         z.string(),
  pod:         z.string(),
  group:       z.enum(["DRY_STANDARD","DRY_HC","REEFER","OPEN_TOP"]),
  ratePerTeu:  z.number().min(0),
  validFrom:   z.string().datetime(),
  validTo:     z.string().datetime().optional(),
});

const BulkOrSingle = z.union([TariffInput, z.array(TariffInput)]);

export async function POST(req: Request) {
  let payload;
  try {
    payload = BulkOrSingle.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (Array.isArray(payload)) {
    // Bulk create (skips duplicates if you add skipDuplicates:true)
    const created = await prismaClient.tariff.createMany({
        data: payload.map(t => ({
            serviceCode: t.serviceCode,
            commodity:   t.commodity,              // ← add this
            pol:         t.pol,
            pod:         t.pod,
            group:       t.group,
            ratePerTeu:  t.ratePerTeu,
            validFrom:   new Date(t.validFrom),
            validTo:     t.validTo ? new Date(t.validTo) : undefined,
        })),
        skipDuplicates: true,
        });
    return NextResponse.json({ count: created.count }, { status: 201 });
  } else {
    // Single create
    const t = payload;
    const created = await prismaClient.tariff.create({
      data: {
        serviceCode: t.serviceCode,
        commodity :t.commodity,
        pol:         t.pol,
        pod:         t.pod,
        group:       t.group,
        ratePerTeu:  t.ratePerTeu,
        validFrom:   new Date(t.validFrom),
        validTo:     t.validTo ? new Date(t.validTo) : undefined,
      }
    });
    return NextResponse.json({ tariff: created }, { status: 201 });
  }
}
