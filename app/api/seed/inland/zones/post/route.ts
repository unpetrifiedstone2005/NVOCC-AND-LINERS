import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";


export const runtime = "nodejs";

const ZoneSchema = z.object({
  country: z.string().min(2, "country is required"),
  name: z.string().min(2, "name is required"),
  postalPrefixes: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = ZoneSchema.parse(body);

    const item = await prismaClient.inlandZone.create({
      data: {
        country: v.country.trim(),
        name: v.name.trim(),
        postalPrefixes: (v.postalPrefixes ?? []).map(p => p.trim()).filter(Boolean),
        notes: v.notes?.trim() || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    // Zod validation errors
    if (err?.issues) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }

    // Prisma known errors (add more if you add unique constraints later)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A zone with the same unique fields already exists." },
        { status: 409 }
      );
    }

    console.error("POST /inland/zones error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
