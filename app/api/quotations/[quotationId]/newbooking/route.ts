import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { BookingStatus } from "@prisma/client";

// 1. Input schema for your booking fields:
const CreateBookingSchema = z.object({
  customerName:            z.string().optional().nullable(),
  customerAddress:         z.string().optional().nullable(),
  contactReference:        z.string().optional().nullable(),
  contactName:             z.string().optional().nullable(),
  contactPhone:            z.string().optional().nullable(),
  contactEmail:            z.string().optional().nullable(),
  routingSelected:         z.string().optional().nullable(),
  originDepot:             z.string().optional().nullable(),
  scheduleDate:            z.string().datetime().optional().nullable(),
  scheduleWeeks:           z.number().optional().nullable(),
  via1:                    z.string().optional().nullable(),
  via2:                    z.string().optional().nullable(),
  destinationDepot:        z.string().optional().nullable(),
  pickupType:              z.enum(["door", "terminal"]).nullable(),
  pickupDate:              z.string().datetime().optional().nullable(),
  deliveryDate:            z.string().datetime().optional().nullable(),
  deliveryType:            z.enum(["door", "terminal"]).nullable(),
  commodity:               z.string().optional().nullable(),
  customsDetails:          z.string().optional().nullable(),
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

    // 3. Fetch & validate quotation
    const quotation = await prismaClient.quotation.findUnique({
      where:  { id: quotationId },
      include: { user: true },
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

    // 4. Compute defaults
    const customerName =
      data.customerName ??
      [quotation.user.firstName, quotation.user.lastName].filter(Boolean).join(" ");
    const customerAddress =
      data.customerAddress ??
      [
        quotation.user.streetAddress,
        quotation.user.city,
        quotation.user.postalCode,
        quotation.user.country,
      ]
        .filter(Boolean)
        .join(", ");

    // 5. Create Booking + Booking Document
    const result = await prismaClient.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId:           quotation.userId,
          quotationId:      quotation.id,
          customerName,
          customerAddress,
          contactReference: data.contactReference ?? undefined,
          contactName:      data.contactName ?? undefined,
          contactPhone:     data.contactPhone ?? undefined,
          contactEmail:     data.contactEmail ?? undefined,
          routingSelected:  data.routingSelected ?? undefined,
          originDepot:      data.originDepot ?? undefined,
          scheduleDate:     data.scheduleDate ? new Date(data.scheduleDate) : undefined,
          scheduleWeeks:    data.scheduleWeeks ?? undefined,
          via1:             data.via1 ?? undefined,
          via2:             data.via2 ?? undefined,
          destinationDepot: data.destinationDepot ?? undefined,
          pickupType:       data.pickupType ?? undefined,
          pickupDate:       data.pickupDate ? new Date(data.pickupDate) : undefined,
          deliveryDate:     data.deliveryDate ? new Date(data.deliveryDate) : undefined,
          deliveryType:     data.deliveryType ?? undefined,
          commodity:        data.commodity ?? undefined,
          customsDetails:   data.customsDetails ?? undefined,
          bolCount:         data.bolCount ?? undefined,
          exportFiling:     data.exportFiling ?? false,
          filingBy:         data.filingBy ?? undefined,
          remarks:          data.remarks ?? undefined,
          status:           BookingStatus.PENDING, // initial status
        },
      });

      const bookingDocument = await tx.document.create({
        data: {
          type:      "BOOKING",
          url:       "",       // you can fill in a generated PDF/URL later
          bookingId: booking.id,
        },
      });

      return { booking, bookingDocument };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (err) {
    console.error("POST /bookings error:", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
