import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { ContainerStatus, BookingStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

// Input validation schema (NO containers array)
const CreateBookingSchema = z.object({
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
});

type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { quotationId: string } }
) {
  try {
    const data: CreateBookingInput = CreateBookingSchema.parse(await req.json());

    // 1. Load & validate quotation
    const quotation = await prismaClient.quotation.findUnique({
      where: { id: params.quotationId },
      include: { containers: true },
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

    // 2. Create booking, booking document, and (if needed) declaration & declaration document
    const { booking, bookingDocument, declaration, declarationDocument } = await prismaClient.$transaction(async (tx) => {
      // Booking
      const booking = await tx.booking.create({
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

      // Booking Document
      const bookingDocument = await tx.document.create({
        data: {
          type: "BOOKING",
          url: "",
          bookingId: booking.id,
        },
      });

      // Dangerous Goods Declaration and Document (if needed)
      let declaration = null;
      let declarationDocument = null;
      const dgContainer = quotation.containers.find(qc => qc.dangerousGoods === true);
      if (dgContainer) {
        declaration = await tx.declaration.create({
          data: {
            bookingId: booking.id,
            quotationId: quotation.id,
            hsCode: dgContainer.hsCode || "",
            goodsDescription: dgContainer.cargoDescription || "",
            countryOfOrigin: quotation.startLocation || "",
            countryOfDestination: quotation.endLocation || "",
            value: new Prisma.Decimal(0),
            currency: "USD",
            dutiesAmount: new Prisma.Decimal(0),
            declarationType: "DG",
            status: "PENDING",
            isDangerous: true,
            unNumber: dgContainer.unNumber || "",
            imoClass: dgContainer.imoClass || "",
            packingGroup: dgContainer.packingGroup || "",
            emergencyContact: data.contactPhone || "",
            createdById: quotation.userId,
          },
        });

        declarationDocument = await tx.document.create({
          data: {
            type: "DECLARATION",
            url: "",
            bookingId: booking.id,
            declarationId: declaration.id,
          },
        });
      }

      return { booking, bookingDocument, declaration, declarationDocument };
    });

    // 3. Save booking-container specs using containers from quotation
    await prismaClient.bookingContainer.createMany({
      data: quotation.containers.map((qc) => ({
        bookingId:        booking.id,
        type:             qc.type,
        qty:              qc.qty,
        shipperOwned:     false,
        cargoDescription: qc.cargoDescription || "",
        hsCode:           qc.hsCode || "",
        weight:           qc.weightPerContainer || 0,
        weightUnit:       qc.weightUnit || "kg",
        dangerousGoods:   qc.dangerousGoods || false,
      })),
    });

    // 4. Attempt allocations (using container specs from quotation)
    let canAllocateAll = true;
    const txOps: any[] = [];

    for (const qc of quotation.containers) {
      const candidates = await prismaClient.container.findMany({
        where: { type: qc.type, status: ContainerStatus.AVAILABLE },
        orderBy: { lastUsedAt: "asc" },
        take: qc.qty,
        select: { id: true },
      });

      if (candidates.length < qc.qty) {
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
      // 5. Commit allocations
      await prismaClient.$transaction(txOps);

      // 6. Mark confirmed + booked
      await prismaClient.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      });
      await prismaClient.quotation.update({
        where: { id: quotation.id },
        data: { status: "booked" },
      });

      // 7. Create invoice using weight/bracket logic
      const bookingContainers = await prismaClient.bookingContainer.findMany({
        where: { bookingId: booking.id },
      });

      let total = new Prisma.Decimal(0);
      for (const spec of bookingContainers) {
        const rateDate = booking.scheduleDate || quotation.validFrom || new Date();
        const sheet = await prismaClient.rateSheet.findFirst({
          where: {
            originPortId:      booking.originDepot,
            destinationPortId: booking.destinationDepot,
            containerType:     spec.type,
            validFrom:         { lte: rateDate },
            validTo:           { gte: rateDate },
          },
          include: { surcharges: true, weightBrackets: true },
        });
        if (!sheet) continue;
        const weightKg = Number(spec.weight) || 0;

        // Find weight bracket
        const bracket = sheet.weightBrackets.find(
          (wb) => weightKg >= wb.minWeightKg && weightKg <= wb.maxWeightKg
        );

        // Base rate or bracket rate
        let base = new Prisma.Decimal(sheet.baseRate);
        if (bracket && bracket.ratePerKg && Number(bracket.ratePerKg) > 0) {
          base = new Prisma.Decimal(bracket.ratePerKg).mul(weightKg);
        }

        // Overweight calculation
        let overweightCharge = new Prisma.Decimal(0);
        if (
          sheet.includedWeightKg &&
          sheet.overweightRatePerKg &&
          weightKg > sheet.includedWeightKg
        ) {
          const overweight = weightKg - sheet.includedWeightKg;
          overweightCharge = new Prisma.Decimal(sheet.overweightRatePerKg).mul(overweight);
        }

        // Surcharges
        const extra = sheet.surcharges.reduce(
          (sum, s) => sum.add(s.amount),
          new Prisma.Decimal(0)
        );

        // Container total
        total = total.add(base.add(overweightCharge).add(extra).mul(spec.qty));
      }

      // Get active bank account for invoice
      const activeBankAccount = await prismaClient.bankAccount.findFirst({
        where: { isActive: true },
      });

      if (!activeBankAccount) {
        return NextResponse.json(
          { error: "No active bank account found for invoice creation" },
          { status: 500 }
        );
      }

      // Create invoice and its document
      const invoice = await prismaClient.invoice.create({
        data: {
          bookingId: booking.id,
          userId:    quotation.userId,
          amount:    total,
          dueDate:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          bankAccountId: activeBankAccount.id
        },
      });

      await prismaClient.document.create({
        data: {
          type: "INVOICE",
          url: "",
          invoiceId: invoice.id,
        },
      });
    }

    // 8. Re-fetch with findUniqueOrThrow so TS knows it’s never null
    const result = await prismaClient.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: {
        containers:  true,
        allocations: { include: { container: true } },
        invoice:     { include: { bankAccount: true } },
        documents:   true,
      },
    });

    // Collect all documents (booking, declaration, invoice, etc.)
    const documents = await prismaClient.document.findMany({
      where: { bookingId: booking.id },
    });

    return NextResponse.json(
      { booking: result, bookingDocument, declaration, declarationDocument, documents },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
