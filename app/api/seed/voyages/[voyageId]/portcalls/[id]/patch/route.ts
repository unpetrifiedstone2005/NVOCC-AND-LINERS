// app/api/voyages/[voyageId]/portcalls/[portCallId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const PatchPortCallSchema = z.object({
  portCode:   z.string().optional(),
  order:      z.number().int().min(1).optional(),
  etd:        z.string().datetime().optional(),
  eta:        z.string().datetime().optional(),
  mode:       z.string().optional(),
  vesselName: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { voyageId: string; portCallId: string } }
) {
  const { voyageId, portCallId } = params;
  const uuid = /^[0-9a-fA-F\-]{36}$/;
  if (!uuid.test(voyageId) || !uuid.test(portCallId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let updates;
  try {
    updates = PatchPortCallSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // ensure port call exists under that voyage
  const existing = await prismaClient.portCall.findFirst({
    where: { id: portCallId, voyageId }
  });
  if (!existing) {
    return NextResponse.json({ error: "PortCall not found" }, { status: 404 });
  }

  const updated = await prismaClient.portCall.update({
    where: { id: portCallId },
    data: {
      ...(updates.portCode   !== undefined && { portCode:   updates.portCode }),
      ...(updates.order      !== undefined && { order:      updates.order }),
      ...(updates.etd        !== undefined && { etd:        new Date(updates.etd) }),
      ...(updates.eta        !== undefined && { eta:        new Date(updates.eta) }),
      ...(updates.mode       !== undefined && { mode:       updates.mode }),
      ...(updates.vesselName !== undefined && { vesselName: updates.vesselName }),
    }
  });

  return NextResponse.json(updated, { status: 200 });
}
