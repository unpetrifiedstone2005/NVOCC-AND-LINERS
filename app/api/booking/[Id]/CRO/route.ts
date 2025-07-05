// app/api/bookings/[bookingId]/release-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";
import { ContainerStatus }         from "@prisma/client";

const CreateCROSchema = z.object({
  releasedToType: z.enum(["TRUCKER","SHIPPER","OTHER"]),
  releasedToId:   z.string().min(1),
  documents: z
    .array(z.object({
      type: z.string(),
      url:  z.string().url()
    }))
    .optional()
});
type CreateCROInput = z.infer<typeof CreateCROSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  // 1) Validate body
  let input: CreateCROInput;
  try {
    input = CreateCROSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  const bookingId = params.bookingId;

  // 2) Load booking to get depot UN/LOCODE
  const booking = await prismaClient.booking.findUniqueOrThrow({
    where: { id: bookingId },
    select: { startLocation: true }
  });
  const depotUnlocode = booking.startLocation;

  // 3) Lookup the applicable detention term
  const term = await prismaClient.detentionTerm.findFirst({
    where: {
      AND: [
        { effectiveFrom: { lte: new Date() } },
        { OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }] },
        { OR: [
            { depotId: depotUnlocode },
            { depotId: null }
          ]
        }
      ]
    },
    orderBy: [
      { depotId: 'desc' },
      { effectiveFrom: 'desc' }
    ]
  });
  const freeDays = term?.freeDays ?? 0;
  const detentionTermId = term?.id;

  // 4) Fetch non-SOC container lines
  const lines = await prismaClient.bookingContainer.findMany({
    where: { bookingId, shipperOwned: false },
    select: { type: true, qty: true }
  });

  // 5) FIFO allocate from AVAILABLE at that depot
  const toAllocate: string[] = [];
  for (const { type, qty } of lines) {
    const available = await prismaClient.container.findMany({
      where: {
        containerTypeIsoCode: type,
        status:               ContainerStatus.AVAILABLE,
        currentDepot:         depotUnlocode
      },
      orderBy: { lastUsedAt: 'asc' },
      take: qty
    });
    if (available.length < qty) {
      return NextResponse.json(
        { error: `Not enough AVAILABLE ${type} at depot ${depotUnlocode}` },
        { status: 409 }
      );
    }
    toAllocate.push(...available.map(c => c.id));
  }

  // 6) Transaction: mark ALLOCATED + create CRO (+ docs)
  const [_, cro] = await prismaClient.$transaction([
    prismaClient.container.updateMany({
      where: { id: { in: toAllocate } },
      data:  { status: ContainerStatus.ALLOCATED }
    }),
    prismaClient.containerReleaseOrder.create({
      data: {
        bookingId,
        releasedToType:   input.releasedToType,
        releasedToId:     input.releasedToId,
        depotUnlocode,
        freeDays,
        detentionTermId,
        releasedContainers: {
          create: toAllocate.map(containerId => ({ containerId }))
        },
        documents: input.documents
          ? { create: input.documents.map(d => ({ type: d.type, url: d.url })) }
          : undefined
      },
      include: {
        releasedContainers: true,
        documents:          true
      }
    })
  ]);

  return NextResponse.json({ cro }, { status: 201 });
}
