// File: app/api/seed/tariffs/post/route.ts
import { NextResponse } from "next/server";
import { z, ZodError }  from "zod";
import { prismaClient }  from "@/app/lib/db";
import { ContainerGroup } from "@prisma/client";

// 1️⃣ Rate schema
const RateInput = z.object({
  containerType: z.string(),
  amount:        z.number(),
});

// 2️⃣ Tariff schema with date-order validation
const TariffInput = z
  .object({
    serviceCode:   z.string(),                     // human-friendly schedule code
    voyageNumber:  z.string(),                     // human-friendly voyage code
    commodity:     z.string(),
    group:         z.nativeEnum(ContainerGroup),
    validFrom:     z.string().datetime(),
    validTo:       z.string().datetime().optional(),
    rates:         z.array(RateInput),
  })
  .refine(
    data =>
      // if validTo provided, it must be after validFrom
      !data.validTo ||
      new Date(data.validFrom) < new Date(data.validTo),
    {
      message: "from should be before to",
      path: ["validTo"],
    }
  );

// Accept either one or an array
const BulkOrSingle = z.union([TariffInput, z.array(TariffInput)]);

export async function POST(req: Request) {
  let payload: z.infer<typeof BulkOrSingle>;
  try {
    payload = BulkOrSingle.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      // Returns [{ path: [...], message: "from should be before to" }, ...]
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Helper to create one tariff record
  async function createOne(t: z.infer<typeof TariffInput>) {
    const svc = await prismaClient.serviceSchedule.findUnique({
      where: { code: t.serviceCode },
      select: { id: true },
    });
    if (!svc) throw new Error(`Unknown service code: ${t.serviceCode}`);

    const voy = await prismaClient.voyage.findUnique({
      where: {
        serviceId_voyageNumber: {
          serviceId:    svc.id,
          voyageNumber: t.voyageNumber,
        },
      },
      select: { id: true },
    });
    if (!voy) throw new Error(`Unknown voyage number: ${t.voyageNumber}`);

    return prismaClient.tariff.create({
      data: {
        scheduleId: svc.id,
        voyageId:   voy.id,
        commodity:  t.commodity,
        group:      t.group,
        validFrom:  new Date(t.validFrom),
        validTo:    t.validTo ? new Date(t.validTo) : null,
        rates: {
          create: t.rates.map(r => ({
            containerType: r.containerType,
            amount:        r.amount,
          })),
        },
      },
      include: { rates: true },
    });
  }

  try {
    if (Array.isArray(payload)) {
      const created = await Promise.all(payload.map(createOne));
      return NextResponse.json({ count: created.length }, { status: 201 });
    } else {
      const created = await createOne(payload);
      return NextResponse.json({ tariff: created }, { status: 201 });
    }
  } catch (err: any) {
    console.error("POST /tariffs error:", err);
    const msg =
      err instanceof ZodError
        ? err.errors
        : err.message || "Failed to create tariff";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
