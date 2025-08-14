import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z } from "zod";

const Body = z.object({
  at: z.string().datetime(),
  source: z.enum(["AUTO", "MANUAL"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; voyageId: string; portCallId?: string; portcallId?: string; cutoffId: string }> }
) {
  const p = await params; // ✅ await params
  const portCallId = p.portCallId ?? p.portcallId;
  const { cutoffId } = p;

  if (!portCallId || !cutoffId) {
    return NextResponse.json({ error: "Missing portCallId or cutoffId" }, { status: 400 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid payload", details: e?.errors ?? e?.message }, { status: 422 });
  }

  const cutoff = await (prismaClient as any).portCallCutoff.findUnique({
    where: { id: cutoffId },
    include: {
      portCall: { select: { id: true, etd: true, voyage: { select: { id: true, serviceId: true } } } },
    },
  });
  if (!cutoff) return NextResponse.json({ error: "Cutoff not found" }, { status: 404 });
  if (cutoff.portCall.id !== portCallId) {
    return NextResponse.json({ error: "Cutoff does not belong to given portCallId" }, { status: 404 });
  }

  if (cutoff.portCall.etd) {
    const atMs = new Date(body.at).getTime();
    if (Number.isNaN(atMs)) return NextResponse.json({ error: "Invalid datetime" }, { status: 422 });
    if (atMs > cutoff.portCall.etd.getTime()) {
      return NextResponse.json(
        { error: `Cutoff must be on/before ETD (${cutoff.portCall.etd.toISOString()}).` },
        { status: 422 }
      );
    }
  }

  const updated = await (prismaClient as any).portCallCutoff.update({
    where: { id: cutoffId },
    data: { at: new Date(body.at), source: body.source ?? undefined },
    select: { id: true, kind: true, at: true, source: true },
  });

  return NextResponse.json({ ...updated, at: new Date(updated.at).toISOString() });
}
