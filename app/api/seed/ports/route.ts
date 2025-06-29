import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";

// Zod schema for a single Port
const PortSchema = z.object({
  id: z.string().optional(), // Optional, will be auto-generated if not provided
  unlocode: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Zod schema for request body (array of ports)
const BodySchema = z.object({
  ports: z.array(PortSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { ports } = BodySchema.parse(await req.json());

    // Prepare data for Prisma
    const portData = ports.map((p) => ({
      id: p.id, // Optional: Prisma will generate if not provided
      unlocode: p.unlocode,
      name: p.name,
      city: p.city,
      country: p.country,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    // Bulk insert ports, skipping duplicates based on unique constraints
    const result = await prismaClient.port.createMany({
      data: portData,
      skipDuplicates: true,
    });

    return NextResponse.json(
      { seeded: { ports: result.count } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
