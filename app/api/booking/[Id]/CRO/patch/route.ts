// app/api/bookings/[bookingId]/release-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";

// 1) Schema for fields you might want to patch
const UpdateCROSchema = z
  .object({
    releasedToType: z.enum(["TRUCKER","SHIPPER","OTHER"]),
    releasedToId:   z.string().min(1),
    depotUnlocode:  z.string().min(1),
    documents: z
      .array(z.object({
        type: z.string(),
        url:  z.string().url()
      }))
  })
  .partial(); // all fields optional

type UpdateCROInput = z.infer<typeof UpdateCROSchema>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  let input: UpdateCROInput;
  try {
    input = UpdateCROSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // Build an update payload only with provided fields
  const data: any = {};
  if (input.releasedToType !== undefined) data.releasedToType = input.releasedToType;
  if (input.releasedToId   !== undefined) data.releasedToId   = input.releasedToId;
  if (input.depotUnlocode  !== undefined) data.depotUnlocode  = input.depotUnlocode;

  if (input.documents) {
    // replace any existing docs
    data.documents = {
      deleteMany: {},
      create: input.documents.map(d => ({ type: d.type, url: d.url }))
    };
  }

  try {
    const cro = await prismaClient.containerReleaseOrder.update({
      where: { bookingId: params.bookingId },
      data,
      include: {
        releasedContainers: {
          include: {
            container: {
              select: { containerNo: true, containerTypeIsoCode: true }
            }
          }
        },
        documents: true
      }
    });
    return NextResponse.json({ cro }, { status: 200 });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'CRO not found for that booking' }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Failed to update CRO' }, { status: 500 });
  }
}
