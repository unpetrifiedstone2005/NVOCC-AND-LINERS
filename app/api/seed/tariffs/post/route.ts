// app/api/tariffs/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { ContainerGroup } from "@prisma/client";

// --- 1. Input schema for one tariff with multiple container rates ---
const RateInput = z.object({
  containerType: z.string().min(1),
  amount:        z.number().min(0),
});

const TariffInput = z.object({
  serviceCode: z.string(),
  commodity:   z.string(),
  pol:         z.string(),
  pod:         z.string(),
  group:       z.nativeEnum(ContainerGroup),
  validFrom:   z.string().datetime(),
  validTo:     z.string().datetime().optional(),
  rates:       z.array(RateInput),
});

// Allow single or bulk
const BulkOrSingle = z.union([TariffInput, z.array(TariffInput)]);

export async function POST(req: Request) {
  let payload: z.infer<typeof BulkOrSingle>;
  try {
    payload = BulkOrSingle.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Helper to create one tariff + its rates
  async function createOne(t: z.infer<typeof TariffInput>) {
    // 1️⃣ find the serviceSchedule by code
    const svc = await prismaClient.serviceSchedule.findUnique({
      where: { code: t.serviceCode },
      select: { id: true }
    });
    if (!svc) {
      throw new Error(`Unknown serviceCode: ${t.serviceCode}`);
    }

    // 2️⃣ create tariff + nested rates
    return prismaClient.tariff.create({
      data: {
        serviceId: svc.id,
        commodity: t.commodity,
        pol:       t.pol,
        pod:       t.pod,
        group:     t.group,
        validFrom: new Date(t.validFrom),
        validTo:   t.validTo ? new Date(t.validTo) : null,
        rates: {
          create: t.rates.map(r => ({
            containerType: r.containerType,
            amount:        r.amount,
          }))
        }
      },
      include: { rates: true }
    });
  }

  try {
    if (Array.isArray(payload)) {
      // Bulk
      const created = await Promise.all(
        payload.map(t => createOne(t))
      );
      return NextResponse.json({ count: created.length }, { status: 201 });
    } else {
      // Single
      const created = await createOne(payload);
      return NextResponse.json({ tariff: created }, { status: 201 });
    }
  } catch (err: any) {
    console.error("POST /tariffs error:", err);
    const msg = err instanceof ZodError
      ? err.errors
      : err.message || "Failed to create tariff";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
