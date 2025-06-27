import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// Booking fields unique to this step
const CreateBookingSchema = z.object({
  quotationId: z.string(),
  contactReference: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  scheduleDate: z.string().datetime().optional().nullable(),
  scheduleWeeks: z.number().optional().nullable(),
  via1: z.string().optional().nullable(),
  via2: z.string().optional().nullable(),
  exportMoT: z.string().optional().nullable(),
  importMoT: z.string().optional().nullable(),
  optimizeReefer: z.boolean().optional(),
  // Add more booking-only fields as needed
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = CreateBookingSchema.parse(await req.json());

    // 1. Get the quotation and check status
    const quotation = await prismaClient.quotation.findUnique({
      where: { id: data.quotationId }
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }
    if (quotation.status !== "accepted") {
      return NextResponse.json({ error: "Quotation must be accepted to book" }, { status: 400 });
    }

    // 2. Create Booking, inheriting mapped fields from Quotation
    const booking = await prismaClient.booking.create({
      data: {
        userId: quotation.userId,                    // From Quotation
        quotationId: quotation.id,                   // From Quotation
        originDepot: quotation.startLocation,        // From Quotation
        pickupType: quotation.pickupType,            // From Quotation
        destinationDepot: quotation.endLocation,     // From Quotation
        deliveryType: quotation.deliveryType,        // From Quotation

        // Booking-specific fields from request
        contactReference: data.contactReference,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : undefined,
        scheduleWeeks: data.scheduleWeeks,
        via1: data.via1,
        via2: data.via2,
        exportMoT: data.exportMoT,
        importMoT: data.importMoT,
        optimizeReefer: data.optimizeReefer ?? false,
        // Add any other logic as needed
      }
    });

    // 3. Optionally update Quotation status to 'booked'
    await prismaClient.quotation.update({
      where: { id: quotation.id },
      data: { status: "booked" }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: "Server Error", details: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server Error", details: "Unknown error" }, { status: 500 });
  }
}
