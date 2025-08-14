// File: app/api/seed/serviceschedules/[scheduleId]/voyages/[voyageId]/portcalls/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { Prisma } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// Config: cutoff policy
// Origin cutoffs, expressed as hours BEFORE ETD (in UTC math).
const ORIGIN_CUTOFF_OFFSETS_HOURS: Record<"ERD" | "FCL_GATEIN" | "VGM" | "DOC_SI", number> = {
  ERD: 72,
  FCL_GATEIN: 24,
  VGM: 12,
  DOC_SI: 24,
};

// Apply auto cutoffs to transshipment? Usually no for shippers; keep false.
const GENERATE_TRANSSHIP_CUTOFFS = false;
// If enabled above, define offsets (e.g., only VGM a few hours before ETD).
const TRANSSHIP_CUTOFF_OFFSETS_HOURS: Partial<Record<"ERD" | "FCL_GATEIN" | "VGM" | "DOC_SI", number>> = {
  // VGM: 6,
};

// ──────────────────────────────────────────────────────────────────────────────
// Schemas

const CutoffKindEnum = z.enum(["ERD", "FCL_GATEIN", "VGM", "DOC_SI"]);
const CutoffInputSchema = z.object({
  kind: CutoffKindEnum,
  at: z.string().datetime(), // ISO 8601 string
});

// Accept strings; enforce ISO with zod; we still sanity-check after parsing.
const CreatePortCallSchema = z
  .object({
    portUnlocode: z.string().nonempty(),
    order: z.number().int().min(1),
    eta: z.string().datetime().optional(), // optional for order=1, required otherwise (validated below)
    etd: z.string().datetime().optional(), // optional only for potential "final call"
    cutoffs: z.array(CutoffInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // ETA required for non-origin
    if (data.order !== 1 && !data.eta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eta"],
        message: "ETA is required for non-origin port calls",
      });
    }

    // Origin must have ETD (to drive voyage departure & cutoffs)
    if (data.order === 1 && !data.etd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["etd"],
        message: "ETD is required for the origin port call (order=1)",
      });
    }

    // If both given, ETD must be strictly after ETA
    if (data.eta && data.etd) {
      const etaDate = new Date(data.eta);
      const etdDate = new Date(data.etd);
      if (!(etdDate > etaDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["etd"],
          message: "ETD must be after ETA",
        });
      }
    }
  });

// ──────────────────────────────────────────────────────────────────────────────
// Helpers

type Kind = z.infer<typeof CutoffKindEnum>;

function toDateOrError(s: string | undefined | null, field: string): Date | null {
  if (s == null) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    throw new ZodError([
      {
        code: "custom",
        message: `${field.toUpperCase()} is not a valid date/time`,
        path: [field],
      },
    ]);
  }
  return d;
}

function hoursBefore(etdUtc: Date, hours: number) {
  return new Date(etdUtc.getTime() - hours * 3600 * 1000);
}

function buildAutoCutoffs(etdUtc: Date, isOrigin: boolean): Array<{ kind: Kind; at: string; source: "AUTO" }> {
  const offsets = isOrigin
    ? ORIGIN_CUTOFF_OFFSETS_HOURS
    : GENERATE_TRANSSHIP_CUTOFFS
    ? TRANSSHIP_CUTOFF_OFFSETS_HOURS
    : {};
  return Object.entries(offsets).map(([k, hrs]) => ({
    kind: k as Kind,
    at: hoursBefore(etdUtc, hrs!).toISOString(),
    source: "AUTO" as const,
  }));
}

// Recompute voyage departure/arrival from its port calls:
// departure = ETD of order=1 (if present)
// arrival   = ETA of highest order that has ETA
async function recomputeVoyageWindow(voyageId: string) {
  const calls = await prismaClient.portCall.findMany({
    where: { voyageId },
    select: { order: true, eta: true, etd: true },
    orderBy: { order: "asc" },
  });

  const origin = calls.find((c) => c.order === 1);
  const lastWithEta = calls.reduce<Date | null>((acc, c) => {
    if (c.eta && (!acc || c.eta > acc)) return c.eta;
    return acc;
  }, null);

  const updates: Record<string, any> = {};
  if (origin?.etd) updates.departure = origin.etd;
  if (lastWithEta) updates.arrival = lastWithEta;

  if (Object.keys(updates).length) {
    await prismaClient.voyage.update({ where: { id: voyageId }, data: updates });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Route

export async function POST(
  req: NextRequest,
  { params }: { params: { scheduleId: string; voyageId: string } }
) {
  const { voyageId } = params;

  // basic guard on id shape
  if (!/^[0-9a-fA-F-]{36}$/.test(voyageId)) {
    return NextResponse.json({ error: "Invalid voyageId" }, { status: 400 });
  }

  // Parse & validate body
  let input: z.infer<typeof CreatePortCallSchema>;
  try {
    input = CreatePortCallSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // Load voyage window to enforce bounds
  const voyage = await prismaClient.voyage.findUnique({
    where: { id: voyageId },
  });
  if (!voyage) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  // Ensure location exists
  const unlocode = input.portUnlocode.trim().toUpperCase();
  const location = await prismaClient.location.findUnique({ where: { unlocode } });
  if (!location) {
    return NextResponse.json({ error: `Location ${unlocode} is not supported` }, { status: 404 });
  }

  // Parse dates with friendly error if invalid
  try {
    var etaDate = toDateOrError(input.eta ?? null, "eta");
    var etdDate = toDateOrError(input.etd ?? null, "etd");
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // Aggregate to know existing orders (for "new final" logic)
  const agg = await prismaClient.portCall.aggregate({
    where: { voyageId },
    _max: { order: true },
    _count: true,
  });
  const hasAnyCalls = (agg._count ?? 0) > 0;
  const currentMaxOrder = agg._max.order ?? 0;
  const isNewFinal = input.order > currentMaxOrder;

  // Load prev/next neighbors for chronology rules
  const [prev, next] = await Promise.all([
    input.order > 1
      ? prismaClient.portCall.findUnique({
          where: { voyageId_order: { voyageId, order: input.order - 1 } }, // requires @@unique([voyageId, order])
          select: { etd: true },
        })
      : Promise.resolve(null),
    prismaClient.portCall.findUnique({
      where: { voyageId_order: { voyageId, order: input.order + 1 } },
      select: { eta: true },
    }),
  ]);

  // ── Sequence prerequisites & chronology checks ─────────────────────────────

  if (input.order > 1) {
    if (!prev) {
      return NextResponse.json(
        { error: `Previous port call (order ${input.order - 1}) not found. Create it first.` },
        { status: 422 }
      );
    }
    if (!prev.etd) {
      return NextResponse.json(
        { error: `Previous port call (order ${input.order - 1}) is missing ETD; cannot schedule next ETA.` },
        { status: 422 }
      );
    }
    // The rule: ETAₙ >= ETDₙ₋₁
    if (etaDate && etaDate < prev.etd) {
      return NextResponse.json(
        {
          error: `ETA for order ${input.order} (${etaDate.toISOString()}) must be on/after ETD of order ${
            input.order - 1
          } (${prev.etd.toISOString()}).`,
        },
        { status: 422 }
      );
    }
  }

  // Forward consistency: if a NEXT call already exists, enforce ETD presence and ETD ≤ next.ETA
  if (next) {
    if (!etdDate) {
      return NextResponse.json(
        { error: `ETD is required for order ${input.order} because a subsequent call (order ${input.order + 1}) already exists.` },
        { status: 422 }
      );
    }
    if (next.eta && etdDate > next.eta) {
      return NextResponse.json(
        { error: `ETD for order ${input.order} must be on/before ETA of order ${input.order + 1}.` },
        { status: 422 }
      );
    }
  }

  // ── Voyage window checks (adaptive) ────────────────────────────────────────
  // We allow the voyage window to be *extended* automatically when:
  // - origin ETD is before current departure (or even after current arrival if there are no other calls),
  // - a new final call's ETA is after current arrival.
  // We only *enforce* strict within-window when inserting a midstream call.
  if (input.order === 1) {
    if (!etdDate) {
      return NextResponse.json({ error: "ETD is required for the origin port call (order=1)" }, { status: 422 });
    }
    // If there are already calls (midstream insert at origin), prevent ETD from violating existing next.ETA (handled above via "next")
    // No hard upper bound against voyage.arrival here; window will be recomputed after insert.
  } else if (isNewFinal) {
    // New final call: allow ETA to extend the voyage arrival.
    if (!etaDate) {
      return NextResponse.json({ error: "ETA is required for non-origin port calls" }, { status: 422 });
    }
    // Also ensure ETD (if provided) is not before ETA (handled by schema) and doesn't violate "next" (no next here since new final).
  } else {
    // Midstream insert: must live within the current voyage window
    if (!etaDate) {
      return NextResponse.json({ error: "ETA is required for non-origin port calls" }, { status: 422 });
    }
    if (etaDate < voyage.departure || etaDate > voyage.arrival) {
      return NextResponse.json(
        {
          error: `ETA must be within voyage window: ${voyage.departure.toISOString()} → ${voyage.arrival.toISOString()}`,
        },
        { status: 422 }
      );
    }
    if (etdDate && (etdDate < voyage.departure || etdDate > voyage.arrival)) {
      return NextResponse.json(
        {
          error: `ETD must be within voyage window: ${voyage.departure.toISOString()} → ${voyage.arrival.toISOString()}`,
        },
        { status: 422 }
      );
    }
  }

  // ── Persist (within a transaction) ──────────────────────────────────────────
  try {
    const created = await prismaClient.$transaction(async (tx) => {
      // Create the port call
      const portCall = await tx.portCall.create({
        data: {
          voyageId,
          portUnlocode: unlocode,
          order: input.order,
          eta: etaDate, // may be null for origin
          etd: etdDate ?? null, // may be null for final calls
        },
      });

      // If this is origin and ETD provided, align voyage.departure
      if (input.order === 1 && etdDate) {
        await tx.voyage.update({
          where: { id: voyageId },
          data: { departure: etdDate },
        });
      }

      // If this is new final and ETA provided, extend voyage.arrival if needed
      if (isNewFinal && etaDate && etaDate > voyage.arrival) {
        await tx.voyage.update({
          where: { id: voyageId },
          data: { arrival: etaDate },
        });
      }

      // Cutoffs:
      // - If user supplied some, save as MANUAL; optionally fill missing kinds as AUTO per policy.
      // - If none supplied and policy allows (origin, or transship if enabled) and we have ETD, create AUTO ones.
      const provided = new Map<Kind, string>();
      (input.cutoffs ?? []).forEach((c) => provided.set(c.kind, c.at));

      const isOrigin = input.order === 1;
      // If there are *no* calls yet and this is origin being first, we certainly have ETD (schema), so generate.
      const shouldGenerate =
        !!etdDate && (isOrigin || (GENERATE_TRANSSHIP_CUTOFFS && input.order > 1));

      let toInsert: Array<{ kind: Kind; at: string; source: "AUTO" | "MANUAL" }> = [];

      if (input.cutoffs?.length) {
        toInsert = input.cutoffs.map((c) => ({ kind: c.kind, at: c.at, source: "MANUAL" as const }));
        if (shouldGenerate) {
          const auto = buildAutoCutoffs(etdDate!, isOrigin);
          auto.forEach((a) => {
            if (!provided.has(a.kind)) toInsert.push(a);
          });
        }
      } else if (shouldGenerate) {
        toInsert = buildAutoCutoffs(etdDate!, isOrigin);
      }

      if (toInsert.length) {
        await tx.portCallCutoff.createMany({
          data: toInsert.map((c) => ({
            portCallId: portCall.id,
            kind: c.kind,
            at: new Date(c.at),
            source: c.source,
          })),
          skipDuplicates: true,
        });
      }

      return portCall;
    });

    // Recompute voyage window AFTER commit (ensures departure/arrival reflect current calls)
    await recomputeVoyageWindow(voyageId);

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Friendly Prisma errors
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint: likely @@unique([voyageId, order])
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: `A port call with order ${input.order} already exists for this voyage.` },
          { status: 409 }
        );
      }
      // FK constraint, etc.
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "Foreign key constraint failed (check voyage/location references)." },
          { status: 422 }
        );
      }
    }
    // Zod bubbled from toDateOrError
    if (e instanceof ZodError) {
      return NextResponse.json({ errors: e.flatten().fieldErrors }, { status: 422 });
    }
    console.error("PortCall POST failed:", e);
    return NextResponse.json({ error: "Failed to create port call" }, { status: 500 });
  }
}
