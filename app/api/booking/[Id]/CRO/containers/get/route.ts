// File: app/api/bookings/[bookingId]/cro/containers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismaClient }           from "@/app/lib/db";

// GET /api/bookings/[bookingId]/cro/containers
export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId is a UUID
  const uuidRegex = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Fetch CROContainer rows for this booking,
  //    including each container's human-readable number
  const croContainers = await prismaClient.cROContainer.findMany({
    where: { cro: { bookingId } },
    select: {
      id: true,
      container: {
        select: {
          containerNo: true    // adjust to your Container model's field name
        }
      }
    }
  });

  // 3) Transform for the front-end
  const result = croContainers.map(c => ({
    id: c.id,
    containerNo: c.container.containerNo
  }));

  return NextResponse.json(result, { status: 200 });
}
