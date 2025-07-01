// app/api/seed/depots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";

const DepotSchema = z.object({
  name:    z.string(),
  address: z.string()
});

const BodySchema = z.object({
  depots: z.array(DepotSchema)
});

export async function POST(req: NextRequest) {
  try {
    const { depots } = BodySchema.parse(await req.json());

    const created = await prismaClient.depot.createMany({
      data: depots.map(d => ({
        name:    d.name,
        address: d.address
      })),
      skipDuplicates: true
    });

    return NextResponse.json({ seeded: created.count }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
