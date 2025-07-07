// File: app/api/bookings/[bookingId]/vgm-transmissions/[transmissionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }            from "zod";
import { prismaClient }           from "@/app/lib/db";

// Zod schema for fields you’re allowed to update
const PatchVGMSchema = z.object({
  verifiedWeight:    z.number().positive().optional(),
  providerSignature: z.string().min(1).optional(),
  shipperCompany:    z.string().min(1).optional(),

  determinationDate: z.string().datetime().optional(),
  solasMethod:       z.enum(["weighbridge", "calculation"]).optional(),
  solasCertificate:  z.string().optional(),
  country:           z.string().optional(),
});
type PatchVGMInput = z.infer<typeof PatchVGMSchema>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string; transmissionId: string } }
) {
  const { bookingId, transmissionId } = params;

  // 1) Validate UUIDs
  const uuidRegex = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
  if (!uuidRegex.test(bookingId) || !uuidRegex.test(transmissionId)) {
    return NextResponse.json({ error: "Invalid bookingId or transmissionId" }, { status: 400 });
  }

  // 2) Parse & validate request body
  let updates: PatchVGMInput;
  try {
    updates = PatchVGMSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 3) Load the existing VGMTransmission, including booking.vgmCutOffAt
  const vgm = await prismaClient.vGMTransmission.findUnique({
    where: { id: transmissionId },
    include: {
      booking: {
        select: { id: true, vgmCutOffAt: true }
      }
    }
  });
  if (!vgm || vgm.bookingId !== bookingId) {
    return NextResponse.json({ error: "VGM entry not found for this booking" }, { status: 404 });
  }

  // 4) Enforce VGM cut-off
  const now = new Date();
  const cutOff = vgm.booking.vgmCutOffAt;
  if (cutOff && now > cutOff) {
    return NextResponse.json(
      { error: `VGM cut-off passed (${cutOff.toISOString()}); cannot amend.` },
      { status: 403 }
    );
  }

  // 5) Apply the patch
  const updated = await prismaClient.vGMTransmission.update({
    where: { id: transmissionId },
    data: {
      ...(updates.verifiedWeight    !== undefined && { verifiedWeight:    updates.verifiedWeight }),
      ...(updates.providerSignature !== undefined && { providerSignature: updates.providerSignature }),
      ...(updates.shipperCompany    !== undefined && { shipperCompany:    updates.shipperCompany }),
      ...(updates.determinationDate !== undefined && { determinationDate: new Date(updates.determinationDate) }),
      ...(updates.solasMethod       !== undefined && { solasMethod:       updates.solasMethod }),
      ...(updates.solasCertificate  !== undefined && { solasCertificate:  updates.solasCertificate }),
      ...(updates.country           !== undefined && { country:           updates.country }),
      // reset status for re-validation
      status: "PENDING",
    }
  });

  return NextResponse.json(updated, { status: 200 });
}
