import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { BookingStatus } from "@prisma/client";  // ✅ enum import

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    // ✅ Ensure status maps to the enum
    if (!(status in BookingStatus)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const booking = await prismaClient.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
    });

    return NextResponse.json(booking);
  } catch (err) {
    console.error("PATCH /booking/status error:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}