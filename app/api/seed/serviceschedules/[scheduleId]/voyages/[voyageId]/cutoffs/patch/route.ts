import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Zod enums matching your Prisma enums
const FacilitySchemeEnum = z.enum(["SMDG", "BIC", "INTERNAL"]).nullable().optional();
const CutoffKindEnum = z.enum(["DOC_SI", "FCL_GATEIN", "VGM", "ERD"]);

const CutoffItemSchema = z.object({
  id: z.string().uuid().optional(),                    // if present, update by id
  facilityScheme: FacilitySchemeEnum,                  // nullable+optional -> we coerce to null
  facilityCode: z.string().nullable().optional(),      // nullable+optional -> we coerce to null
  kind: CutoffKindEnum,
  at: z.string().datetime({ message: "Invalid ISO datetime" }),
  source: z.string().optional(),                       // "MANUAL" | "EDI" | "CALCULATED" (free text)
});

const BodySchema = z.object({
  cutoffs: z.array(CutoffItemSchema).min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { scheduleId: string; voyageId: string } }
) {
  const { scheduleId, voyageId } = await params;

  // Make sure voyage belongs to the schedule
  const voyage = await prismaClient.voyage.findFirst({
    where: { id: voyageId, serviceId: scheduleId },
    select: { id: true },
  });
  if (!voyage) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  // Parse body
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid body", details: err.errors }, { status: 400 });
  }

  try {
    const result = await prismaClient.$transaction(async (tx) => {
      const updatedOrCreated = [];

      for (const item of body.cutoffs) {
        const fs = item.facilityScheme ?? null;
        const fc = item.facilityCode ?? null;
        const atDate = new Date(item.at);
        const src = item.source ?? "MANUAL";

        if (item.id) {
          // Update by primary key
          const row = await tx.voyageCutoff.update({
            where: { id: item.id },
            data: {
              facilityScheme: fs,
              facilityCode: fc,
              kind: item.kind,
              at: atDate,
              source: src,
            },
          });
          updatedOrCreated.push(row);
          continue;
        }

        // If both facility fields are non-null we can rely on the composite unique upsert
        if (fs !== null && fc !== null) {
          const row = await tx.voyageCutoff.upsert({
            where: {
              voyageId_facilityScheme_facilityCode_kind: {
                voyageId,
                facilityScheme: fs,
                facilityCode: fc,
                kind: item.kind,
              },
            },
            update: { at: atDate, source: src },
            create: {
              voyageId,
              facilityScheme: fs,
              facilityCode: fc,
              kind: item.kind,
              at: atDate,
              source: src,
            },
          });
          updatedOrCreated.push(row);
          continue;
        }

        // When either facility field is null, Postgres UNIQUE semantics allow duplicates.
        // So: findFirst + update OR create (deterministic single record).
        const existing = await tx.voyageCutoff.findFirst({
          where: {
            voyageId,
            kind: item.kind,
            facilityScheme: fs,
            facilityCode: fc,
          },
          select: { id: true },
        });

        const row = existing
          ? await tx.voyageCutoff.update({
              where: { id: existing.id },
              data: { at: atDate, source: src },
            })
          : await tx.voyageCutoff.create({
              data: {
                voyageId,
                facilityScheme: fs,
                facilityCode: fc,
                kind: item.kind,
                at: atDate,
                source: src,
              },
            });

        updatedOrCreated.push(row);
      }

      return updatedOrCreated;
    });

    return NextResponse.json({ cutoffs: result }, { status: 200 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // e.g., composite unique violation (rare here unless mis-shaped payload)
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Duplicate cutoff for the same facility/kind." },
          { status: 409 }
        );
      }
    }
    console.error("PATCH voyage cutoffs failed:", e);
    return NextResponse.json({ error: "Failed to update cutoffs" }, { status: 500 });
  }
}
