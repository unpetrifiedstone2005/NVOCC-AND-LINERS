// File: app/api/voyages/get/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const QuerySchema = z.object({
  pol:      z.string(),           // required
  pod:      z.string(),           // required
  from:     z.string().datetime(),// earliest departure date
  maxCount: z.preprocess(Number, z.number().int().min(1)).default(5),
});

export async function GET(request: Request) {
  let q;
  try {
    const url = new URL(request.url);
    q = QuerySchema.parse({
      pol:      url.searchParams.get("pol")!,
      pod:      url.searchParams.get("pod")!,
      from:     url.searchParams.get("from")!,
      maxCount: url.searchParams.get("maxCount"),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  // find voyages that call at both POL and POD, departing after `from`
  const voyages = await prismaClient.voyage.findMany({
    where: {
      departure: { gte: new Date(q.from) },
      AND: [
        { portCalls: { some: { portCode: q.pol } } },
        { portCalls: { some: { portCode: q.pod } } }
      ]
    },
    orderBy: { departure: "asc" },
    take: q.maxCount,
    include: {
      portCalls: {
        where: { portCode: { in: [q.pol, q.pod] } },
        orderBy: { order: "asc" },
        select: { portCode: true, etd: true, eta: true, order: true }
      },
      service: {
        select: { code: true, description: true }
      }
    }
  });

  return NextResponse.json({ items: voyages }, { status: 200 });
}
