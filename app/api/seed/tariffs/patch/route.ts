// File: app/api/tariffs/patch/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const Query = z.object({
  serviceCode: z.string(),
  pol:         z.string(),
  pod:         z.string(),
  commodity:   z.string(),
  group:       z.enum(["DRY_STANDARD","DRY_HC","REEFER","OPEN_TOP"]),
  validFrom:   z.string().datetime(),
  ratePerTeu:  z.number().min(0).optional(),
  validTo:     z.string().datetime().nullable().optional(),
});

export async function PATCH(req: Request) {
  let q;
  try {
    q = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  // build flat where for updateMany
  const flatWhere = {
    serviceCode: q.serviceCode,
    pol:         q.pol,
    pod:         q.pod,
    commodity:   q.commodity,
    group:       q.group,
    validFrom:   new Date(q.validFrom),
  };

  // build data object
  const data: any = {};
  if (q.ratePerTeu !== undefined) data.ratePerTeu = q.ratePerTeu;
  if (q.validTo    !== undefined) data.validTo    = q.validTo ? new Date(q.validTo) : null;

  // perform updateMany to catch zero‐row case
  const result = await prismaClient.tariff.updateMany({ where: flatWhere, data });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tariff not found" }, { status: 404 });
  }

  // now fetch the single updated record via the compound PK
  const updated = await prismaClient.tariff.findUnique({
    where: {
      serviceCode_pol_pod_commodity_group_validFrom: {
        serviceCode: q.serviceCode,
        pol:         q.pol,
        pod:         q.pod,
        commodity:   q.commodity,
        group:       q.group,
        validFrom:   new Date(q.validFrom),
      }
    }
  });

  return NextResponse.json({ tariff: updated }, { status: 200 });
}
