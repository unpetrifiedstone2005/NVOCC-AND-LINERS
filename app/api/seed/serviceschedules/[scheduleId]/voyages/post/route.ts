// app/api/seed/serviceschedules/[scheduleId]/voyages/post.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z } from "zod";

// 1) PortCall schema: require eta < etd (if both present)
const PortCallSchema = z
  .object({
    sequence:   z.number().int().positive(),
    portCode:   z.string().min(1),
    callType:   z.string().optional(),
    eta:        z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid ETA" }),
    etd:        z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid ETD" }),
    vesselName: z.string().optional(),
  })
  .refine(
    (pc) => new Date(pc.eta) < new Date(pc.etd),
    { message: "PortCall ETA must be before ETD", path: ["etd"] }
  );

// 2) Voyage schema: require departure < arrival, plus portCalls array
const VoyageWithPortCallsSchema = z
  .object({
    voyageNumber: z.string().min(1),
    departure:    z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid departure date" }),
    arrival:      z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid arrival date" }),
    vesselName:   z.string().min(1),
    portCalls:    z.array(PortCallSchema).optional(),
  })
  .refine(
    (v) => new Date(v.departure) < new Date(v.arrival),
    { message: "Voyage departure must be before arrival", path: ["arrival"] }
  );

export async function POST(
  req: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  const { scheduleId } = await params;

  // parse & validate
  let body: z.infer<typeof VoyageWithPortCallsSchema>;
  try {
    body = VoyageWithPortCallsSchema.parse(await req.json());
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid request", errors: err.errors },
      { status: 400 }
    );
  }

  // ensure schedule exists
  const schedule = await prismaClient.serviceSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: `No ServiceSchedule found with id=${scheduleId}` },
      { status: 404 }
    );
  }

  // create voyage (with nested portCalls)
  try {
    const created = await prismaClient.voyage.create({
      data: {
        serviceId:    scheduleId,
        voyageNumber: body.voyageNumber,
        departure:    new Date(body.departure),
        arrival:      new Date(body.arrival),
        vesselName:   body.vesselName,
        portCalls: body.portCalls
          ? {
              create: body.portCalls.map((pc) => ({
                order:      pc.sequence,
                portCode:   pc.portCode,
                callType:   pc.callType,
                eta:        new Date(pc.eta),
                etd:        new Date(pc.etd),
                vesselName: pc.vesselName,
              })),
            }
          : undefined,
      },
      include: { portCalls: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: `Voyage number already exists` },
        { status: 409 }
      );
    }
    console.error("createVoyage error:", err);
    return NextResponse.json(
      { error: "Failed to create voyage" },
      { status: 500 }
    );
  }
}
