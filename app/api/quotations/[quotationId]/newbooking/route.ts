import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { ContainerStatus, BookingStatus, Prisma, CustomsReferenceType } from "@prisma/client";

// 1. Input validation schema
const CreateBookingSchema = z.object({
  customerName:            z.string().optional().nullable(),
  customerAddress:         z.string().optional().nullable(),
  contactReference:        z.string().optional().nullable(),
  contactName:             z.string().optional().nullable(),
  contactPhone:            z.string().optional().nullable(),
  contactEmail:            z.string().optional().nullable(),

  contractNumber:          z.string().optional().nullable(),
  contractValidTo:         z.string().datetime().optional().nullable(),
  contractualParty:        z.string().optional().nullable(),
  contractualPartyAddress: z.string().optional().nullable(),
  
  routingSelected:         z.string().optional().nullable(),
  originDepot:             z.string().optional().nullable(),
  scheduleDate:            z.string().datetime().optional().nullable(),
  scheduleWeeks:           z.number().optional().nullable(),
  via1:                    z.string().optional().nullable(),
  via2:                    z.string().optional().nullable(),
  destinationDepot:        z.string().optional().nullable(),
  pickupType:              z.enum(["door", "terminal"]).optional().nullable(),
  exportMoT:               z.string().optional().nullable(),
  importMoT:               z.string().optional().nullable(),
  optimizeReefer:          z.boolean().optional(),
  scheduleOption:          z.string().optional().nullable(),

  pickupDate:              z.string().datetime().optional().nullable(),
  deliveryDate:            z.string().datetime().optional().nullable(),
  deliveryType:            z.enum(["door", "terminal"]).optional().nullable(),

  commodity:               z.string().optional().nullable(),
  customsDetails:          z.string().optional().nullable(),

  customsReferences: z
    .array(
      z.object({
        type:      z.string(),
        reference: z.string(),
      })
    )
    .optional()
    .nullable(),
  bolCount:                z.number().optional().nullable(),
  exportFiling:            z.boolean().optional(),
  filingBy:                z.string().optional().nullable(),
  remarks:                 z.string().optional().nullable(),
});

type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// 2. Handler
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quotationId: string }> }
) {
  try {
    const { quotationId } = await params;
    const data = CreateBookingSchema.parse(await req.json());

    // Fetch quotation & relations
    const quotation = await prismaClient.quotation.findUnique({
      where: { id: quotationId },
      include: {
        user: true,
        cargo: true,
        containers: { include: { cargo: true } },
      },
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

    // Prefill customer fields from user if blank
    const customerName =
      data.customerName
        ?? quotation.user.companyName
        ?? [quotation.user.firstName, quotation.user.lastName].filter(Boolean).join(" ")
        ?? undefined;
    const customerAddress =
      data.customerAddress
        ?? [
            quotation.user.streetAddress,
            quotation.user.city,
            quotation.user.postalCode,
            quotation.user.country,
          ]
            .filter(Boolean)
            .join(", ")
        ?? undefined;

    // Create booking, docs, DG declarations, customs refs in one transaction
    const { booking, bookingDocument, declarations, declarationDocuments, customsReferences } =
      await prismaClient.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            userId:      quotation.userId,
            quotationId: quotation.id,

            customerName,
            customerAddress,
            contactReference: data.contactReference,
            contactName:      data.contactName,
            contactPhone:     data.contactPhone,
            contactEmail:     data.contactEmail,

            contractNumber:            data.contractNumber ?? undefined,
            contractValidTo:           data.contractValidTo ? new Date(data.contractValidTo) : undefined,
            contractualParty:          data.contractualParty ?? undefined,
            contractualPartyAddress:   data.contractualPartyAddress ?? undefined,
            routingSelected: data.routingSelected ?? undefined,
            originDepot:     data.originDepot ?? quotation.startLocation,
            scheduleDate:    data.scheduleDate ? new Date(data.scheduleDate) : undefined,
            scheduleWeeks:   data.scheduleWeeks ?? undefined,
            via1:            data.via1 ?? undefined,
            via2:            data.via2 ?? undefined,
            destinationDepot:data.destinationDepot ?? quotation.endLocation,
            pickupType:      data.pickupType ?? quotation.pickupType,
            exportMoT:       data.exportMoT ?? undefined,
            importMoT:       data.importMoT ?? undefined,
            optimizeReefer:  data.optimizeReefer ?? false,
            scheduleOption:  data.scheduleOption ?? undefined,

            pickupDate:    data.pickupDate ? new Date(data.pickupDate) : undefined,
            deliveryDate:  data.deliveryDate ? new Date(data.deliveryDate) : undefined,
            deliveryType:  data.deliveryType ?? quotation.deliveryType,

            commodity:      data.commodity ?? quotation.commodity,
            customsDetails: data.customsDetails ?? undefined,

            bolCount:    data.bolCount ?? undefined,
            exportFiling:data.exportFiling ?? false,
            filingBy:    data.filingBy ?? undefined,
            remarks:     data.remarks ?? undefined,
          },
        });

        const bookingDocument = await tx.document.create({
          data: { type: "BOOKING", url: "", bookingId: booking.id },
        });

        const dgDecls: any[] = [];
        const dgDocs: any[] = [];
        for (const c of quotation.cargo.filter((c) => c.isDangerous)) {
          const decl = await tx.declaration.create({
            data: {
              bookingId:            booking.id,
              quotationId:          quotation.id,
              hsCode:               c.hsCode || "UNKNOWN",
              goodsDescription:     c.description || "No description",
              countryOfOrigin:      quotation.startLocation,
              countryOfDestination: quotation.endLocation,
              value:                new Prisma.Decimal(0),
              currency:             "USD",
              dutiesAmount:         new Prisma.Decimal(0),
              declarationType:      "DG",
              status:               "PENDING",
              isDangerous:          true,
              unNumber:             c.unNumber || "",
              imoClass:             c.imoClass || "",
              packingGroup:         c.packingGroup || "",
              emergencyContact:     data.contactPhone || "",
              createdById:          quotation.userId,
            },
          });
          dgDecls.push(decl);

          dgDocs.push(
            await tx.document.create({
              data: {
                type:          "DECLARATION",
                url:           "",
                bookingId:     booking.id,
                declarationId: decl.id,
              },
            })
          );
        }

        // --- CustomsReferences Logic ---
        let customsRefs: any[] = [];
        if (Array.isArray(data.customsReferences) && data.customsReferences.length > 0) {
          customsRefs = await Promise.all(
            data.customsReferences.map(ref =>
              tx.customsReference.create({
                data: {
                  bookingId: booking.id,
                  type: ref.type as CustomsReferenceType,
                  reference: ref.reference
                }
              })
            )
          );
        }

        return {
          booking,
          bookingDocument,
          declarations: dgDecls,
          declarationDocuments: dgDocs,
          customsReferences: customsRefs,
        };
      });

    // Create bookingContainer rows
    await prismaClient.bookingContainer.createMany({
      data: quotation.containers.map((qc) => ({
        bookingId:        booking.id,
        type:             qc.type,
        qty:              qc.qty,
        shipperOwned:     qc.shipperOwned,
        cargoDescription: "",
        weight:           qc.weightPerContainer.toNumber(),
        weightUnit:       qc.weightUnit,
        dangerousGoods:   false,
        imoClass:         "",
        unNumber:         "",
      })),
    });

    // Attempt container allocations
    let canAllocateAll = true;
    const ops: any[] = [];
    for (const qc of quotation.containers) {
      const avail = await prismaClient.container.findMany({
        where:   { type: qc.type, status: ContainerStatus.AVAILABLE },
        orderBy: { lastUsedAt: "asc" },
        take:    qc.qty,
        select:  { id: true },
      });
      if (avail.length < qc.qty) {
        canAllocateAll = false;
        break;
      }
      for (const { id: cid } of avail) {
        ops.push(
          prismaClient.allocation.create({
            data: { bookingId: booking.id, containerId: cid },
          }),
          prismaClient.container.update({
            where: { id: cid },
            data:  { status: ContainerStatus.ALLOCATED, lastUsedAt: new Date() },
          })
        );
      }
    }

    let warning: string | null = null;
    if (!canAllocateAll) {
      warning = "Could not allocate all containers. Invoice not created.";
    } else {
      // Commit allocations & mark confirmed
      await prismaClient.$transaction(ops);
      await prismaClient.booking.update({
        where: { id: booking.id },
        data:  { status: BookingStatus.CONFIRMED },
      });
      await prismaClient.quotation.update({
        where: { id: quotation.id },
        data:  { status: "booked" },
      });

      // Invoice calculation with both ocean- and inland-legs
      let grandTotal = new Prisma.Decimal(0);
      const rateDate = booking.scheduleDate ?? quotation.validFrom;

      for (const qc of quotation.containers) {
        const qty      = new Prisma.Decimal(qc.qty);
        const weightKg = new Prisma.Decimal(qc.weightPerContainer.toString());

        for (const cargo of qc.cargo) {
          // Ocean leg lookup
          const oceanSheet = await prismaClient.rateSheet.findFirst({
            where: {
              originPortId:      quotation.startLocation,
              destinationPortId: quotation.endLocation,
              containerType:     qc.type,
              isDangerousGoods:  cargo.isDangerous,
              validFrom:         { lte: rateDate },
              validTo:           { gte: rateDate },
            },
            include: { surcharges: true, weightBrackets: true },
          });

          // Inland leg lookup (only if depots provided)
          let depotSheet = null;
          if (booking.originDepot && booking.destinationDepot) {
            depotSheet = await prismaClient.rateSheet.findFirst({
              where: {
                originDepotId:      booking.originDepot,
                destinationDepotId: booking.destinationDepot,
                containerType:      qc.type,
                isDangerousGoods:   cargo.isDangerous,
                validFrom:          { lte: rateDate },
                validTo:            { gte: rateDate },
              },
              include: { surcharges: true, weightBrackets: true },
            });
          }

          // helper to compute one leg
          const computeLeg = (sheet: typeof oceanSheet) => {
            if (!sheet) return new Prisma.Decimal(0);
            let base = new Prisma.Decimal(sheet.baseRate);
            const bracket = sheet.weightBrackets.find(wb =>
              weightKg.gte(wb.minWeightKg) && weightKg.lte(wb.maxWeightKg)
            );
            if (bracket) base = bracket.ratePerKg.mul(weightKg);

            let overweightCharge = new Prisma.Decimal(0);
            if (
              sheet.includedWeightKg &&
              sheet.overweightRatePerKg &&
              weightKg.gt(sheet.includedWeightKg)
            ) {
              overweightCharge = sheet.overweightRatePerKg.mul(
                weightKg.minus(sheet.includedWeightKg)
              );
            }

            const extra = sheet.surcharges.reduce((sum, s) => {
              if (!cargo.isDangerous || s.appliesToDG) {
                return sum.add(new Prisma.Decimal(s.amount));
              }
              return sum;
            }, new Prisma.Decimal(0));

            return base.add(overweightCharge).add(extra);
          };

          const oceanTotal = computeLeg(oceanSheet);
          const depotTotal = computeLeg(depotSheet);
          const lineTotal  = oceanTotal.add(depotTotal);
          const containerTotal = lineTotal.mul(qty);

          grandTotal = grandTotal.add(containerTotal);
        }
      }

      const acct = await prismaClient.bankAccount.findFirst({
        where: { isActive: true },
      });
      if (!acct) {
        warning = "No active bank account found. Invoice not created.";
      } else {
        const invoice = await prismaClient.invoice.create({
          data: {
            bookingId:     booking.id,
            userId:        quotation.userId,
            amount:        grandTotal,
            dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            bankAccountId: acct.id,
          },
        });

        await prismaClient.document.create({
          data: {
            type:      "INVOICE",
            url:       "",
            invoiceId: invoice.id,
          },
        });
      }
    }

    // Fetch for response
    const full = await prismaClient.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: {
        containers:  true,
        allocations: { include: { container: true } },
        invoice:     { include: { bankAccount: true } },
        documents:   true,
      },
    });

    const invoiceOut = full.invoice
      ? { ...full.invoice, amount: full.invoice.amount.toNumber() }
      : null;

    const documents = await prismaClient.document.findMany({
      where: { bookingId: booking.id },
    });

    return NextResponse.json(
      {
        booking,
        invoice:             invoiceOut,
        bookingDocument,
        declarations,
        declarationDocuments,
        documents,
        customsReferences, // included for confirmation/debug
        warning,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /newbooking error:", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
