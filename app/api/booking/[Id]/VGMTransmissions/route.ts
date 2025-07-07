// File: app/api/bookings/[bookingId]/vgm-transmissions/batch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }            from "zod";
import { prismaClient }           from "@/app/lib/db";

// 1) Zod schema for one VGMTransmission row
const SingleVGMSchema = z.object({
  containerNo:       z.string().min(1),     // renamed to match your Container model
  verifiedWeight:    z.number().positive(),
  providerSignature: z.string().min(1),
  shipperCompany:    z.string().min(1),

  // optional details
  determinationDate: z.string().datetime().optional(),
  solasMethod:       z.enum(["weighbridge", "calculation"]).optional(),
  solasCertificate:  z.string().optional(),
  country:           z.string().optional(),
});

// 2) Batch schema: one or many entries
const BatchVGMSchema = z.object({
  entries: z.array(SingleVGMSchema).min(1)
});
type BatchVGMInput = z.infer<typeof BatchVGMSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // a) Validate bookingId
  if (!/^[0-9A-Fa-f\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // b) Parse & validate request body
  let payload: BatchVGMInput;
  try {
    payload = BatchVGMSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // c) Fetch Container master records by containerNo
  const containerNos = payload.entries.map(e => e.containerNo);
  const containers = await prismaClient.container.findMany({
    where: { containerNo: { in: containerNos } },
    select: { id: true, containerNo: true }
  });
  const containerIdByNo = new Map(containers.map(c => [c.containerNo, c.id]));

  // d) Fetch CROContainer records for this booking
  const croContainers = await prismaClient.cROContainer.findMany({
    where: { cro: { bookingId } },
    select: { id: true, containerId: true }
  });
  const croByContainerId = new Map(croContainers.map(c => [c.containerId, c.id]));

  // e) Upsert each VGMTransmission in a single transaction
  const results = await prismaClient.$transaction(
    payload.entries.map(e => {
      const contId = containerIdByNo.get(e.containerNo);
      if (!contId) {
        throw new Error(`Unknown containerNo: ${e.containerNo}`);
      }
      const croContainerId = croByContainerId.get(contId);
      if (!croContainerId) {
        throw new Error(`Container ${e.containerNo} not in CRO for booking ${bookingId}`);
      }
      return prismaClient.vGMTransmission.upsert({
        where: {
          bookingId_croContainerId: { bookingId, croContainerId }
        },
        create: {
          bookingId,
          croContainerId,
          verifiedWeight:    e.verifiedWeight,
          providerSignature: e.providerSignature,
          shipperCompany:    e.shipperCompany,
          determinationDate: e.determinationDate ? new Date(e.determinationDate) : undefined,
          solasMethod:       e.solasMethod,
          solasCertificate:  e.solasCertificate,
          country:           e.country,
        },
        update: {
          verifiedWeight:    e.verifiedWeight,
          providerSignature: e.providerSignature,
          shipperCompany:    e.shipperCompany,
          determinationDate: e.determinationDate ? new Date(e.determinationDate) : undefined,
          solasMethod:       e.solasMethod,
          solasCertificate:  e.solasCertificate,
          country:           e.country,
          status:            "PENDING", // reset for re-validation
        }
      });
    })
  );

  return NextResponse.json(results, { status: 201 });
}
