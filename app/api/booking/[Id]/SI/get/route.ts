// app/api/users/[userId]/si/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  // 1) Validate userId format (UUID)
  if (!/^[0-9a-fA-F\-]{36}$/.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  // 2) Fetch all SIs whose booking.userId matches
  const sis = await prismaClient.shippingInstruction.findMany({
    where: {
      booking: {
        userId: userId,
      },
    },
    include: {
      containers:   true,
      packingLists: true,
      documents:    true,
      booking: {
        select: { id: true, startLocation: true, endLocation: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3) Return the array (may be empty)
  return NextResponse.json(sis, { status: 200 });
}
