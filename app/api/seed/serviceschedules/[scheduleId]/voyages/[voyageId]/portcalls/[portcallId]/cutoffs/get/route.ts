import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; voyageId: string; portCallId?: string; portcallId?: string }> }
) {
  const p = await params; // ✅ await params (not the whole context)
  const portCallId = p.portCallId ?? p.portcallId; // tolerate folder casing

  if (!portCallId) {
    return NextResponse.json({ error: "Missing portCallId" }, { status: 400 });
  }

  try {
    const portCall = await prismaClient.portCall.findUnique({
      where: { id: portCallId },
      select: { id: true, portUnlocode: true },
    });
    if (!portCall) {
      return NextResponse.json({ error: "Port call not found" }, { status: 404 });
    }

    // Optional timezone lookup
    let timezone = "UTC";
    try {
      const code = portCall.portUnlocode;
      if (code) {
        const any = prismaClient as any;
        const portModel =
          any.Port ?? any.PortCatalog ?? any.Ports ?? any.port ?? any.ports ?? any.Unlocode ?? any.unlocode ?? null;
        if (portModel?.findUnique) {
          const port = await portModel.findUnique({
            where: { unlocode: code },
            select: { timezone: true },
          });
          if (port?.timezone) timezone = port.timezone as string;
        }
      }
    } catch {
      // keep UTC
    }

    // Include IDs so the client can PATCH by cutoffId
    let cutoffs: Array<{ id: string; kind: string; at: string; source?: string }> = [];
    try {
      const rows = await (prismaClient as any).portCallCutoff.findMany({
        where: { portCallId },
        orderBy: { kind: "asc" },
        select: { id: true, kind: true, at: true, source: true },
      });
      cutoffs = rows.map((c: any) => ({ ...c, at: new Date(c.at).toISOString() }));
    } catch {
      try {
        const rows = await (prismaClient as any).cutoff.findMany({
          where: { portCallId },
          orderBy: { kind: "asc" },
          select: { id: true, kind: true, at: true, source: true },
        });
        cutoffs = rows.map((c: any) => ({ ...c, at: new Date(c.at).toISOString() }));
      } catch {
        // leave empty
      }
    }

    return NextResponse.json({ port: { timezone }, cutoffs });
  } catch (err) {
    console.error("cutoffs/get failed:", err);
    return NextResponse.json({ port: { timezone: "UTC" }, cutoffs: [] });
  }
}
