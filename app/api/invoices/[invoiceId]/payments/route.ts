import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type { BLDraftContainer, BookingContainer } from "@prisma/client";

const BLDraftHBLFields = z.object({
  shipper: z.string().optional(),
  shippersReference: z.string().optional(),
  carriersReference: z.string().optional(),
  uniqueConsignmentRef: z.string().optional(),
  consignee: z.string().optional(),
  carrierName: z.string().optional(),
  notifyParty: z.string().optional(),
  additionalNotifyParty: z.string().optional(),
  preCarriageBy: z.string().optional(),
  placeOfReceipt: z.string().optional(),
  vesselOrAircraft: z.string().optional(),
  voyageNo: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  placeOfDelivery: z.string().optional(),
  finalDestination: z.string().optional(),
  additionalInformation: z.string().optional(),
  shippedOnBoardDate: z.string().datetime().optional(),
  marksAndNumbers: z.string().optional(),
  kindAndNoOfPackages: z.string().optional(),
  descriptionOfGoods: z.string().optional(),
  netWeightKg: z.number().optional(),
  grossWeightKg: z.number().optional(),
  measurementsM3: z.number().optional(),
  totalThisPage: z.string().optional(),
  consignmentTotal: z.string().optional(),
  containerNumbers: z.string().optional(),
  sealNumbers: z.string().optional(),
  sizeType: z.string().optional(),
  totalNoOfContainersText: z.string().optional(),
  noOfOriginalBLs: z.number().optional(),
  incoterms2020: z.string().optional(),
  payableAt: z.string().optional(),
  freightCharges: z.string().optional(),
  termsAndConditions: z.string().optional(),
  placeAndDateOfIssue: z.string().optional(),
  signatoryCompany: z.string().optional(),
  authorizedSignatory: z.string().optional(),
  signature: z.string().optional()
}).partial();


const PaymentSchema = z.object({
  amount: z.number(),
  method: z.string(),
  reference: z.string().optional().nullable(),
  paidAt: z.string().datetime().optional(),
  blDraft: BLDraftHBLFields.optional()
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
          invoiceId: params.invoiceId, // Use invoiceId from URL
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
        include: { booking: { include: { containers: true } } },
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

        // 4b. Prepare B/L draft data
        const blDraftData: any = {
          documentNo: generateBLNo(invoice.bookingId),
          booking: { connect: { id: invoice.bookingId } },
          document: { connect: { id: blDocument.id } },
        };

        if (data.blDraft) {
          Object.assign(blDraftData, data.blDraft);
          if (data.blDraft.shippedOnBoardDate) {
            blDraftData.shippedOnBoardDate = new Date(data.blDraft.shippedOnBoardDate);
          }
        }

        // 4c. Create the B/L draft
        blDraft = await tx.bLDraft.create({
          data: blDraftData,
        });

        // 4d. Create BLDraftContainer records for each BookingContainer
        if (invoice.booking?.containers && invoice.booking.containers.length > 0) {
          blDraftContainers = await Promise.all(
            invoice.booking.containers.map((container: BookingContainer) => {
              const containerData = {
                bLDraftId: blDraft!.documentNo,
                containerNumber: container.id,
                sizeType: container.type,
                kindAndNoOfPackages: String(container.qty),
                descriptionOfGoods: container.cargoDescription,
                grossWeightKg: Number(container.weight),
                // Add more fields if your BLDraftContainer requires them
              };
              return tx.bLDraftContainer.create({ data: containerData });
            })
          );
        }

        // 4e. Create a BLDraftVersion snapshotting the initial draft state
        const versionDocument = await tx.document.create({
          data: {
            type: "BL_DRAFT_VERSION",
            url: "",
            bookingId: invoice.bookingId,
          },
        });

        blDraftVersion = await tx.bLDraftVersion.create({
          data: {
            draftNo: blDraft.documentNo,
            documentId: versionDocument.id,
            snapshot: blDraft,
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
