import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { portCallId: string } }
) {
  const { portCallId } = params;

  try {
    // Grab only fields we know exist on PortCall
    const portCall = await prismaClient.portCall.findUnique({
      where: { id: portCallId },
      select: { id: true, portUnlocode: true },
    });

    // Default timezone if you don’t have a ports catalog
    let timezone = "UTC";

    // Best-effort ports catalog lookup without TS errors.
    // If you have a model like `Port`/`Ports`/`Unlocode` with `unlocode` and `timezone`,
    // this will try them in order. If none exist, we keep UTC.
    try {
      const code = portCall?.portUnlocode;
      if (code) {
        const anyClient = prismaClient as any;
        const portModel =
          anyClient.Port ??
          anyClient.PortCatalog ??
          anyClient.Ports ??
          anyClient.port ??
          anyClient.ports ??
          anyClient.Unlocode ??
          anyClient.unlocode ??
          null;

        if (portModel?.findUnique) {
          const port = await portModel.findUnique({
            where: { unlocode: code },
            select: { timezone: true },
          });
          if (port?.timezone) timezone = port.timezone as string;
        }
      }
    } catch {
      // ignore and keep UTC
    }

    // Load cutoffs for this port call.
    // Prefer the `portCallCutoff` model; fall back to `cutoff` if that’s your schema.
    let cutoffs: Array<{ kind: string; at: string; source?: string }> = [];
    try {
      cutoffs = await (prismaClient as any).portCallCutoff.findMany({
        where: { portCallId },
        orderBy: { kind: "asc" },
        select: { kind: true, at: true, source: true },
      });
    } catch {
      try {
        cutoffs = await (prismaClient as any).cutoff.findMany({
          where: { portCallId },
          orderBy: { kind: "asc" },
          select: { kind: true, at: true, source: true },
        });
      } catch {
        // leave as empty array
      }
    }

    // Always return 200 so the UI doesn’t log 404 even when there are no cutoffs
    return NextResponse.json({ port: { timezone }, cutoffs });
  } catch (err) {
    console.error("GET /api/seed/portcalls/[portCallId]/cutoffs failed:", err);
    return NextResponse.json({ port: { timezone: "UTC" }, cutoffs: [] });
  }
}
