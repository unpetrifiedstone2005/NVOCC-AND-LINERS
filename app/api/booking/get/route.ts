import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET() {
  try {
    const bookings = await prismaClient.booking.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    console.error("GET /booking error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}