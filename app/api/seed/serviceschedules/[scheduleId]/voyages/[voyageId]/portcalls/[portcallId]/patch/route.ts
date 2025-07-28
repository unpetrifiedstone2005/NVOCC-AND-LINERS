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
  { params }: { params: { scheduleId: string; voyageId: string; portcallId: string } }
) {
  const { scheduleId, voyageId, portcallId } = await params;

  // UUID check for all three
  const uuid = /^[0-9a-fA-F\-]{36}$/;
  if (!uuid.test(scheduleId) || !uuid.test(voyageId) || !uuid.test(portcallId)) {
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

  // Ensure port call exists for this voyage (and schedule)
  const existing = await prismaClient.portCall.findFirst({
    where: { id: portcallId, voyageId }
  });
  if (!existing) {
    return NextResponse.json({ error: "PortCall not found" }, { status: 404 });
  }

  // ---- ETA/ETD Constraints ----
  if (updates.eta !== undefined || updates.etd !== undefined) {
    // Fill in missing values from existing
    const eta = updates.eta !== undefined ? new Date(updates.eta) : existing.eta;
    const etd = updates.etd !== undefined ? new Date(updates.etd) : existing.etd;

    if (!eta || !etd || isNaN(eta.getTime()) || isNaN(etd.getTime())) {
      return NextResponse.json(
        { error: "Both ETA and ETD must be valid ISO dates" },
        { status: 422 }
      );
    }
    if (eta >= etd) {
      return NextResponse.json(
        { error: "ETA must be before ETD" },
        { status: 422 }
      );
    }
  }

  // ---- Actual Update ----
  const updated = await prismaClient.portCall.update({
    where: { id: portcallId },
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
