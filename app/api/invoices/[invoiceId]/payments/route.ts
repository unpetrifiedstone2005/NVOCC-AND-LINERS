import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type { BLDraftContainer, BookingContainer } from "@prisma/client";

// Payment schema: only payment info is required
const PaymentSchema = z.object({
  amount: z.number(),
  method: z.string(),
  reference: z.string().optional().nullable(),
  paidAt: z.string().datetime().optional()
});

export async function POST(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const data = PaymentSchema.parse(await req.json());

    const result = await prismaClient.$transaction(async (tx) => {
      // 1. Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: params.invoiceId,
          amount: data.amount,
          method: data.method,
          reference: data.reference ?? undefined,
          paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        },
      });

      // 2. Update invoice status to PAID and get bookingId and containers
      const invoice = await tx.invoice.update({
        where: { id: params.invoiceId },
        data: { status: "PAID" },
        include: {
          booking: {
            include: {
              containers: true,
              allocations: {
                include: { container: true }
              }
            }
          }
        },
      });

      // 3. Check if a B/L draft already exists for this booking
      let blDraft = await tx.bLDraft.findFirst({
        where: { bookingId: invoice.bookingId },
      });

      let blDocument = null;
      let blDraftVersion = null;
      let blDraftContainers: BLDraftContainer[] = [];

      if (!blDraft) {
        // 4a. Create a new Document for the B/L draft
        blDocument = await tx.document.create({
          data: {
            type: "BL_DRAFT",
            url: "",
            bookingId: invoice.bookingId,
          },
        });

        // 4b. Prepare B/L draft data from booking
        const booking = invoice.booking;
        const firstContainer = booking.containers[0] || {};
        const firstAllocation = booking.allocations[0] || {};
        const firstAllocContainer = firstAllocation.container || {};

        // Compose kindAndNoOfPackages as a string (e.g., "1 x 40HC - DRY")
        const kindAndNoOfPackages = booking.containers
          .map(c => `${c.qty} x ${c.type}`)
          .join(", ");

        // Compose container numbers and seal numbers as comma-separated strings
        const containerNumbers = booking.allocations
          .map(a => a.container?.containerNo)
          .filter(Boolean)
          .join(", ") || null;

        // Compose seal numbers if available (assuming you have them in allocation or container)
        const sealNumbers = booking.allocations
          .map(a => a.sealNumber)
          .filter(Boolean)
          .join(", ") || null;



        // Compose gross/net weights and volumes as totals
        const grossWeightKg = booking.containers.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) || null;
        const netWeightKg = grossWeightKg; // If you have net weight, use that instead

        // Compose container volume if you have it (otherwise null)
        const measurementsM3 = null;

        // Compose B/L draft data
          const blDraftData: any = {
            documentNo: generateBLNo(invoice.bookingId),
            booking: { connect: { id: invoice.bookingId } },
            document: { connect: { id: blDocument.id } },
            status: "OPEN",

            // Routing & Schedule
            originDepot: booking.originDepot ?? null,
            destinationDepot: booking.destinationDepot ?? null,
            portOfLoading:  null,        // Use booking value, or null
            portOfDischarge:  null,    // Use booking value, or null
            pickupType: booking.pickupType ?? null,
            deliveryType: booking.deliveryType ?? null,
            scheduleDate: booking.scheduleDate ?? null,
            scheduleWeeks: booking.scheduleWeeks ?? null,
            via1: booking.via1 ?? null,
            via2: booking.via2 ?? null,

            // Customs & Remarks
            remarks: booking.remarks ?? null,

            // Other mapped fields
            bolCount: booking.bolCount ?? null,

            // B/L-specific or legal fields
            shipper: booking.contactName ?? null,
            shippersReference: booking.contactReference ?? null,
            carriersReference: null,
            uniqueConsignmentRef: null,
            consignee: booking.customerName ?? null,
            carrierName: null,
            notifyParty: null,
            additionalNotifyParty: null,
            preCarriageBy: booking.exportMoT ?? null,
            vesselOrAircraft: null,
            voyageNo: null,
            placeOfReceipt: null,
            finalDestination: null,
            shippedOnBoardDate: booking.scheduleDate ?? null,
            marksAndNumbers: null,
            kindAndNoOfPackages,
            descriptionOfGoods: booking.commodity ?? null,
            netWeightKg,
            grossWeightKg,
            measurementsM3,
            totalThisPage: null,
            consignmentTotal: null,
            incoterms2020: null,
            payableAt: null,
            freightCharges: null,
            termsAndConditions: null,
            placeAndDateOfIssue: null,
            signatoryCompany: null,
            authorizedSignatory: null,
            signature: null,
            documentType: null,
            numberOfFreightedOriginalBLs: null,
            numberOfFreightedCopies: null,
            numberOfUnfreightedOriginalBLs: null,
            numberOfUnfreightedCopies: null,
            placeOfIssue: null,
            dateOfIssue: null,
            freightPayableAtDetails: null,
            freightTerms: null,
            currency: null,
            exchangeRate: null,
            forwardingAgent: null,
            exportReference: null,
            notifyAddress: null,
            grossVolumeM3: null,
            netVolumeM3: null,
            outerPackingType: null,
            numberOfOuterPacking: null,
            imoClass: firstContainer.imoClass ?? null,
            unNumber: firstContainer.unNumber ?? null,
            customsReference: null,
            sealNumbers,
            instructions: null,
            deliveryInstructions: null,
            remarksToCarrier: null,
            serviceContractNumber: null,
            bookingReference: booking.contactReference ?? null,
          };


        // 4c. Create the B/L draft
        blDraft = await tx.bLDraft.create({
          data: blDraftData,
        });

        // 4d. Create BLDraftContainer records for each BookingContainer
        if (booking.containers && booking.containers.length > 0) {
          blDraftContainers = await Promise.all(
            booking.containers.map((container: BookingContainer) => {
              const alloc = booking.allocations.find(a => a.containerId === container.id) as any || {};
              const allocContainer = alloc.container || {};

              return tx.bLDraftContainer.create({
                data: {
                  bLDraftId: blDraft!.documentNo,
                  containerNumber: allocContainer.containerNo || container.id,
                  sizeType: container.type,
                  noOfPackages: container.qty,
                  kindOfPackages: null,
                  descriptionOfGoods: container.cargoDescription || booking.commodity || null,
                  grossWeight: container.weight ? Number(container.weight) : null,
                  grossWeightUnit: container.weightUnit ?? null,
                  netWeight: null,
                  netWeightUnit: null,
                  grossVolume: null,
                  grossVolumeUnit: null,
                  netVolume: null,
                  netVolumeUnit: null,
                  measurementsM3: null,
                  sealNumber: allocContainer.sealNumber || null,
                }
              });
            })
          );
        }

        // 4e. Create BLDraftVersion snapshotting the initial draft state
        blDraftVersion = await tx.bLDraftVersion.create({
          data: {
            draftNo: blDraft.documentNo,
            snapshot: {
              ...blDraft,
              containers: blDraftContainers.map((c) => ({
                containerNumber: c.containerNumber,
                sizeType: c.sizeType,
                noOfPackages: c.noOfPackages,
                kindOfPackages: c.kindOfPackages,
                descriptionOfGoods: c.descriptionOfGoods,
                grossWeight: c.grossWeight,
              })),
            },
          },
        });
      }

      // Ensure blDraft is never null here
      if (!blDraft) {
        throw new Error("BL Draft is unexpectedly null after creation");
      }

      return { payment, invoice, blDraft, blDocument, blDraftVersion, blDraftContainers };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Payment endpoint error:", err);
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// Utility to generate B/L number (customize as needed)
function generateBLNo(bookingId: string): string {
  return `BL-${bookingId}-${Date.now()}`;
}



