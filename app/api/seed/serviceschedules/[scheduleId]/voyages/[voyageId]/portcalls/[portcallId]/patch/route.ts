import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const PatchPortCallSchema = z.object({
  portUnlocode: z.string().nonempty().optional(),
  order:        z.number().int().min(1).optional(),
  eta:          z.string().datetime().optional(),
  etd:          z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { voyageId: string; portcallId: string } }
) {
  const { voyageId, portcallId } = params;

  // 1️⃣ UUID sanity checks
  const uuidRe = /^[0-9a-fA-F\-]{36}$/;
  if (!uuidRe.test(voyageId) || !uuidRe.test(portcallId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // 2️⃣ Parse & validate input
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

  // 3️⃣ Ensure the port call exists on that voyage
  const existing = await prismaClient.portCall.findFirst({
    where: { id: portcallId, voyageId }
  });
  if (!existing) {
    return NextResponse.json({ error: "PortCall not found" }, { status: 404 });
  }

  // 4️⃣ If changing location, verify it exists
  if (updates.portUnlocode) {
    const loc = await prismaClient.location.findUnique({
      where: { unlocode: updates.portUnlocode }
    });
    if (!loc) {
      return NextResponse.json(
        { error: `Location ${updates.portUnlocode} not supported` },
        { status: 404 }
      );
    }
  }

  // 5️⃣ ETA/ETD consistency check
  if (updates.eta !== undefined || updates.etd !== undefined) {
    let etaDate: Date;
    if (updates.eta) {
      etaDate = new Date(updates.eta);
    } else if (existing.eta) {
      etaDate = existing.eta;
    } else {
      return NextResponse.json(
        { error: "ETA is required when updating dates" },
        { status: 422 }
      );
    }

    let etdDate: Date;
    if (updates.etd) {
      etdDate = new Date(updates.etd);
    } else if (existing.etd) {
      etdDate = existing.etd;
    } else {
      return NextResponse.json(
        { error: "ETD is required when updating dates" },
        { status: 422 }
      );
    }

    if (isNaN(etaDate.getTime()) || isNaN(etdDate.getTime())) {
      return NextResponse.json(
        { error: "Both ETA and ETD must be valid ISO dates" },
        { status: 422 }
      );
    }
    if (etaDate >= etdDate) {
      return NextResponse.json(
        { error: "ETA must be before ETD" },
        { status: 422 }
      );
    }
  }

  // 6️⃣ Perform the update
  const updated = await prismaClient.portCall.update({
    where: { id: portcallId },
    data: {
      ...(updates.portUnlocode && { portUnlocode: updates.portUnlocode }),
      ...(updates.order        && { order:        updates.order }),
      ...(updates.eta          && { eta:          new Date(updates.eta) }),
      ...(updates.etd          && { etd:          new Date(updates.etd) }),
    }
  });

  return NextResponse.json(updated, { status: 200 });
}
