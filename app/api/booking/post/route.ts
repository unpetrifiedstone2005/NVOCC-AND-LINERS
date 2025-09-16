// app/api/booking/post/route.ts
import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const booking = await prismaClient.booking.create({
      data: {
        userId: session.user.id, // ✅ always from session
        quotationId: body.quotationId,
        customerName: body.customerName,
        contactReference: body.contactReference,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        startLocation: body.startLocation,
        departureDate: body.departureDate,
        endLocation: body.endLocation,
        arrivalDate: body.arrivalDate,
        pickupOption: body.pickupOption,
        deliveryOption: body.deliveryOption,
        exportMOT: body.exportMOT,
        importMOT: body.importMOT,
        remarks: body.remarks,
        status: body.status ?? "PENDING",
      },
    });

    return NextResponse.json(booking);
  } catch (err) {
    console.error("POST /booking error", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}