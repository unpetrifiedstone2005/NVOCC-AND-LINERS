// app/api/seed/serviceschedules/[scheduleId]/voyages/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z } from "zod";
import { CutoffKind, FacilityScheme, Prisma } from "@prisma/client";

// ---- configurable defaults (HOURS before ETD) for auto cut-offs ----
const ERD_HOURS_BEFORE_ETD        = Number(process.env.CUT_ERD_HOURS_BEFORE_ETD        ?? 5 * 24); // 5 days
const FCL_GATEIN_HOURS_BEFORE_ETD = Number(process.env.CUT_FCL_HOURS_BEFORE_ETD        ?? 24);
const VGM_HOURS_BEFORE_ETD        = Number(process.env.CUT_VGM_HOURS_BEFORE_ETD        ?? 12);
const DOC_SI_HOURS_BEFORE_ETD     = Number(process.env.CUT_DOC_SI_HOURS_BEFORE_ETD     ?? 24);

// ---------- payload schema ----------
const CutoffItem = z.object({
  facilityScheme: z.nativeEnum(FacilityScheme).nullish(),
  facilityCode: z.string().nullish(),
  kind: z.nativeEnum(CutoffKind),
  at: z.string().datetime(), // ISO
  source: z.enum(["MANUAL", "AUTO", "CALCULATED"]).optional(),
});

// Accept both FE shapes:
// - New FE: { polUnlocode, podUnlocode, departure, arrival }
// - BE shape: { loadPortUnlocode, dischargePortUnlocode, etdUtc, etaUtc }
const VoyageCreateSchema = z
  .object({
    voyageNumber: z.string().min(1),
    vesselName: z.string().min(1),

    // normalized names after pre-processing (see below)
    loadPortUnlocode: z.string().min(3),
    dischargePortUnlocode: z.string().min(3),
    etdUtc: z.string().datetime(),
    etaUtc: z.string().datetime(),

    cutoffs: z.array(CutoffItem).optional(),
  })
  .refine((v) => new Date(v.etdUtc) < new Date(v.etaUtc), {
    message: "ETD must be before ETA",
    path: ["etaUtc"],
  });

// ---------- utils ----------
function normalizeBody(input: any) {
  const norm = {
    voyageNumber: input?.voyageNumber,
    vesselName: input?.vesselName,
    loadPortUnlocode:
      input?.loadPortUnlocode ?? input?.polUnlocode ?? input?.pol ?? null,
    dischargePortUnlocode:
      input?.dischargePortUnlocode ?? input?.podUnlocode ?? input?.pod ?? null,
    etdUtc: input?.etdUtc ?? input?.departure ?? null,
    etaUtc: input?.etaUtc ?? input?.arrival ?? null,
    cutoffs: Array.isArray(input?.cutoffs) ? input.cutoffs : undefined,
  };
  // Uppercase UN/LOCODEs if present
  if (typeof norm.loadPortUnlocode === "string")
    norm.loadPortUnlocode = norm.loadPortUnlocode.toUpperCase();
  if (typeof norm.dischargePortUnlocode === "string")
    norm.dischargePortUnlocode = norm.dischargePortUnlocode.toUpperCase();
  return norm;
}

// Build AUTO cutoffs for any kinds not already provided
const AUTO_HOURS: Record<CutoffKind, number> = {
  ERD: ERD_HOURS_BEFORE_ETD,
  FCL_GATEIN: FCL_GATEIN_HOURS_BEFORE_ETD,
  VGM: VGM_HOURS_BEFORE_ETD,
  DOC_SI: DOC_SI_HOURS_BEFORE_ETD,
};

function makeAutoCutoffs(etd: Date, existingKinds: Set<CutoffKind>) {
  const msPerHour = 60 * 60 * 1000;
  return (Object.keys(AUTO_HOURS) as CutoffKind[])
    .filter((k) => !existingKinds.has(k))
    .map((k) => ({
      facilityScheme: null as FacilityScheme | null,
      facilityCode: null as string | null,
      kind: k,
      at: new Date(etd.getTime() - AUTO_HOURS[k] * msPerHour).toISOString(),
      source: "AUTO" as const,
    }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  const { scheduleId } = await params;

  // Parse + normalize body first (accept FE/BE naming), then validate
  let body: z.infer<typeof VoyageCreateSchema>;
  try {
    const raw = await req.json();
    body = VoyageCreateSchema.parse(normalizeBody(raw));
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid request", errors: err.errors ?? err },
      { status: 400 }
    );
  }

  // Ensure schedule exists
  const schedule = await prismaClient.serviceSchedule.findUnique({
    where: { id: scheduleId },
    select: { id: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: `No ServiceSchedule found with id=${scheduleId}` },
      { status: 404 }
    );
  }

  // Ensure ports exist (supported locations)
  const [pol, pod] = await Promise.all([
    prismaClient.location.findUnique({
      where: { unlocode: body.loadPortUnlocode },
    }),
    prismaClient.location.findUnique({
      where: { unlocode: body.dischargePortUnlocode },
    }),
  ]);
  if (!pol) {
    return NextResponse.json(
      { error: `Unknown load port ${body.loadPortUnlocode}` },
      { status: 422 }
    );
  }
  if (!pod) {
    return NextResponse.json(
      { error: `Unknown discharge port ${body.dischargePortUnlocode}` },
      { status: 422 }
    );
  }

  // Reject domestic voyages (same ISO country code from UN/LOCODE), unless explicitly allowed
  if (process.env.ALLOW_DOMESTIC !== "true") {
    const polCC = body.loadPortUnlocode.slice(0, 2).toUpperCase();
    const podCC = body.dischargePortUnlocode.slice(0, 2).toUpperCase();
    if (polCC === podCC) {
      return NextResponse.json(
        {
          error: `Domestic voyages are not supported: ${body.loadPortUnlocode} → ${body.dischargePortUnlocode} (country=${polCC}).`,
        },
        { status: 422 }
      );
    }
  }

  const etd = new Date(body.etdUtc);
  const eta = new Date(body.etaUtc);

  // Merge user-provided cutoffs + AUTO ERD/FCL_GATEIN/VGM/DOC_SI for any missing kinds
  const incomingCutoffs = Array.isArray(body.cutoffs) ? body.cutoffs : [];
  const existingKinds = new Set<CutoffKind>(incomingCutoffs.map((c) => c.kind));
  const autoCutoffs = makeAutoCutoffs(etd, existingKinds);
  const mergedCutoffs = [...incomingCutoffs, ...autoCutoffs];

  try {
    const created = await prismaClient.$transaction(async (tx) => {
      // Create voyage
      const voyage = await tx.voyage.create({
        data: {
          serviceId: scheduleId,
          voyageNumber: body.voyageNumber,
          vesselName: body.vesselName,

          // Keep legacy + explicit UTC columns in sync
          departure: etd,
          arrival: eta,
          etdUtc: etd,
          etaUtc: eta,

          loadPortUnlocode: body.loadPortUnlocode,
          dischargePortUnlocode: body.dischargePortUnlocode,
        },
      });

      // Persist cutoffs (user + AUTO missing kinds)
      if (mergedCutoffs.length) {
        await tx.voyageCutoff.createMany({
          data: mergedCutoffs.map((c) => ({
            voyageId: voyage.id,
            facilityScheme: c.facilityScheme ?? null,
            facilityCode: c.facilityCode ?? null,
            kind: c.kind,
            at: new Date(c.at),
            source: c.source ?? "MANUAL",
          })),
          skipDuplicates: true,
        });
      }

      return voyage;
    });

    // Return voyage + its cutoffs for convenience
    const full = await prismaClient.voyage.findUnique({
      where: { id: created.id },
      include: { cutoffs: { orderBy: { at: "asc" } } },
    });

    return NextResponse.json(full ?? created, { status: 201 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: `Voyage ${body.voyageNumber} already exists for this service` },
          { status: 409 }
        );
      }
      if (err.code === "P2003") {
        return NextResponse.json(
          { error: "Foreign key constraint failed (check service/ports)" },
          { status: 422 }
        );
      }
    }
    console.error("voyage POST failed:", err);
    return NextResponse.json({ error: "Failed to create voyage" }, { status: 500 });
  }
}
