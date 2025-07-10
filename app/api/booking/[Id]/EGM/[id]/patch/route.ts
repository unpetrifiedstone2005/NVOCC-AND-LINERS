// PATCH /api/bookings/:bookingId/egm/:egmId
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z } from "zod";

const EgmPatchBody = z.object({
  vesselName:      z.string().optional(),
  voyageNumber:    z.string().optional(),
  portOfLoading:   z.string().optional(),
  portOfDischarge: z.string().optional(),
  data:            z.any().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string; egmId: string } }
) {
  const { bookingId, egmId } = params;
  let body;
  try {
    body = EgmPatchBody.parse(await req.json());
  } catch (err: any) {
    return NextResponse.json({ error: err.errors || err.message }, { status: 400 });
  }

  // Verify the EGM exists and belongs to this booking
  const existing = await prismaClient.eGM.findUnique({
    where: { id: egmId },
    select: { id: true, bookingId: true },
  });
  if (!existing || existing.bookingId !== bookingId) {
    return NextResponse.json({ error: "EGM not found for this booking" }, { status: 404 });
  }

  // Update only the provided fields
  const updated = await prismaClient.eGM.update({
    where: { id: egmId },
    data: {
      ...(body.vesselName      !== undefined && { vesselName:      body.vesselName }),
      ...(body.voyageNumber    !== undefined && { voyageNumber:    body.voyageNumber }),
      ...(body.portOfLoading   !== undefined && { portOfLoading:   body.portOfLoading }),
      ...(body.portOfDischarge !== undefined && { portOfDischarge: body.portOfDischarge }),
      ...(body.data            !== undefined && { data:            body.data }),
    },
  });

  return NextResponse.json({ success: true, egm: updated });
}
