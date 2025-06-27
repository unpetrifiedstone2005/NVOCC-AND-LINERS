// /app/api/bookings/route.ts
import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { ContainerStatus, BookingStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

// 1️⃣ Input schema
const CreateBookingSchema = z.object({
  quotationId:      z.string(),
  contactReference: z.string().optional().nullable(),
  contactName:      z.string().optional().nullable(),
  contactPhone:     z.string().optional().nullable(),
  contactEmail:     z.string().optional().nullable(),
  scheduleDate:     z.string().datetime().optional().nullable(),
  scheduleWeeks:    z.number().optional().nullable(),
  via1:             z.string().optional().nullable(),
  via2:             z.string().optional().nullable(),
  exportMoT:        z.string().optional().nullable(),
  importMoT:        z.string().optional().nullable(),
  optimizeReefer:   z.boolean().optional(),

  containers: z
    .array(
      z.object({
        type: z.string(),
        qty:  z.number().int().min(1),
      })
    )
    .min(1, "At least one container must be requested"),
});

type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export async function POST(req: NextRequest) {
  try {
    const data: CreateBookingInput = CreateBookingSchema.parse(await req.json());

    // 2️⃣ Load & validate quotation
    const quotation = await prismaClient.quotation.findUnique({
      where: { id: data.quotationId },
    });
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }
    if (quotation.status !== "accepted") {
      return NextResponse.json(
        { error: "Quotation must be accepted to book" },
        { status: 400 }
      );
    }

    // 3️⃣ Create booking
    const booking = await prismaClient.booking.create({
      data: {
        userId:           quotation.userId,
        quotationId:      quotation.id,
        originDepot:      quotation.startLocation,
        pickupType:       quotation.pickupType,
        destinationDepot: quotation.endLocation,
        deliveryType:     quotation.deliveryType,

        contactReference: data.contactReference,
        contactName:      data.contactName,
        contactPhone:     data.contactPhone,
        contactEmail:     data.contactEmail,
        scheduleDate:     data.scheduleDate ? new Date(data.scheduleDate) : undefined,
        scheduleWeeks:    data.scheduleWeeks,
        via1:             data.via1,
        via2:             data.via2,
        exportMoT:        data.exportMoT,
        importMoT:        data.importMoT,
        optimizeReefer:   data.optimizeReefer ?? false,
      },
    });

    // 4️⃣ Save booking‐container specs
    await prismaClient.bookingContainer.createMany({
      data: data.containers.map((c) => ({
        bookingId:        booking.id,
        type:             c.type,
        qty:              c.qty,
        shipperOwned:     false,
        cargoDescription: "",
        hsCode:           "",
        weight:           0,
        weightUnit:       "kg",
        dangerousGoods:   false,
      })),
    });

    // 5️⃣ Attempt allocations
    let canAllocateAll = true;
    const txOps: any[] = [];

    for (const spec of data.containers) {
      const candidates = await prismaClient.container.findMany({
        where: { type: spec.type, status: ContainerStatus.AVAILABLE },
        orderBy: { lastUsedAt: "asc" },
        take: spec.qty,
        select: { id: true },
      });

      if (candidates.length < spec.qty) {
        canAllocateAll = false;
        break;
      }

      for (const { id: containerId } of candidates) {
        txOps.push(
          prismaClient.allocation.create({
            data: { bookingId: booking.id, containerId },
          }),
          prismaClient.container.update({
            where: { id: containerId },
            data: { status: ContainerStatus.ALLOCATED, lastUsedAt: new Date() },
          })
        );
      }
    }

    if (canAllocateAll) {
      // 6️⃣ Commit allocations
      await prismaClient.$transaction(txOps);

      // 7️⃣ Mark confirmed + booked
      await prismaClient.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      });
      await prismaClient.quotation.update({
        where: { id: quotation.id },
        data: { status: "booked" },
      });

      // 8️⃣ Create invoice (demo formula)
      let total = new Prisma.Decimal(0);
      for (const spec of data.containers) {
        const sheet = await prismaClient.rateSheet.findFirst({
          where: {
            originPortId:      booking.originDepot,
            destinationPortId: booking.destinationDepot,
            containerType:     spec.type,
            validFrom:         { lte: new Date() },
            validTo:           { gte: new Date() },
          },
          include: { surcharges: true },
        });
        if (!sheet) continue;
        const base = sheet.baseRate;
        const extra = sheet.surcharges.reduce(
          (sum, s) => sum.add(s.amount),
          new Prisma.Decimal(0)
        );
        total = total.add(base.add(extra).mul(spec.qty));
      }

      await prismaClient.invoice.create({
        data: {
          bookingId: booking.id,
          userId:    quotation.userId,
          amount:    total,
          dueDate:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 9️⃣ Re-fetch with findUniqueOrThrow so TS knows it’s never null
    const result = await prismaClient.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: {
        containers:  true,
        allocations: { include: { container: true } },
        invoice:     true,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
