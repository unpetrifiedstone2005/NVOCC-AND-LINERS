import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z, ZodError } from "zod";

const isUUID = (s: string) => /^[0-9a-fA-F-]{36}$/.test(s);

const SourceEnum = z.enum(["AUTO", "MANUAL"]).default("MANUAL");
const PatchSchema = z.object({
  at: z.string().datetime().optional(),   // new cutoff time (ISO)
  source: SourceEnum.optional(),          // optional; default MANUAL
});

// Types for safe narrowing
type LoadedOk = {
  ok: true;
  cutoff: {
    id: string;
    kind: string;
    at: Date;
    source: "AUTO" | "MANUAL";
  };
  pc: {
    id: string;
    etd: Date | null;
    voyage: { id: string; serviceId: string };
  };
};

type LoadedErr = { ok: false; error: string; status: 404 };

/**
 * Load cutoff and assert it belongs to the given schedule → voyage → portCall.
 * Returns a discriminated union for clean narrowing.
 */
async function loadAndAssertHierarchy(
  scheduleId: string,
  voyageId: string,
  portCallId: string,
  cutoffId: string
): Promise<LoadedOk | LoadedErr> {
  const cutoff = await prismaClient.portCallCutoff.findUnique({
    where: { id: cutoffId },
    include: {
      portCall: {
        select: {
          id: true,
          etd: true,
          voyage: { select: { id: true, serviceId: true } },
        },
      },
    },
  });

  if (!cutoff) return { ok: false, error: "Cutoff not found", status: 404 };

  const pc = cutoff.portCall;
  if (pc.id !== portCallId || pc.voyage.id !== voyageId || pc.voyage.serviceId !== scheduleId) {
    return { ok: false, error: "Cutoff does not belong to the given path", status: 404 };
  }

  return {
    ok: true,
    cutoff: {
      id: cutoff.id,
      kind: cutoff.kind as any,
      at: cutoff.at,
      source: cutoff.source as any,
    },
    pc: {
      id: pc.id,
      etd: pc.etd,
      voyage: pc.voyage,
    },
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { scheduleId: string; voyageId: string; portCallId: string; cutoffId: string } }
) {
  const { scheduleId, voyageId, portCallId, cutoffId } = params;

  if (![scheduleId, voyageId, portCallId, cutoffId].every(isUUID)) {
    return NextResponse.json({ error: "Invalid path parameters" }, { status: 400 });
  }

  // Parse body
  let body: z.infer<typeof PatchSchema>;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ errors: e.flatten().fieldErrors }, { status: 422 });
    }
    throw e;
  }

  // Load + assert hierarchy
  const loaded = await loadAndAssertHierarchy(scheduleId, voyageId, portCallId, cutoffId);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  // Validate time logic: cutoff must be on/before ETD (when ETD exists)
  if (body.at) {
    const at = new Date(body.at);
    if (isNaN(at.getTime())) {
      return NextResponse.json({ errors: { at: ["AT is not a valid date/time"] } }, { status: 422 });
    }
    if (loaded.pc.etd && at.getTime() > loaded.pc.etd.getTime()) {
      return NextResponse.json(
        { error: `Cutoff must be on/before ETD (${loaded.pc.etd.toISOString()}).` },
        { status: 422 }
      );
    }
  }

  // Persist update
  const updated = await prismaClient.portCallCutoff.update({
    where: { id: cutoffId },
    data: {
      at: body.at ? new Date(body.at) : undefined,
      source: body.source ?? undefined, // unchanged if not provided
    },
    select: { id: true, kind: true, at: true, source: true },
  });

  return NextResponse.json({
    id: updated.id,
    kind: updated.kind,
    at: updated.at.toISOString(),
    source: updated.source,
  });
}
