// File: app/api/quotations/[quotationId]/routings/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// (1) Validate path parameter
const ParamsSchema = z.object({
  quotationId: z.string().uuid(),
});

export async function GET(request: Request, { params }: { params: Record<string,string> }) {
  // 1. Parse & validate quotationId
  let quotationId: string;
  try {
    ({ quotationId } = ParamsSchema.parse(params));
  } catch (err) {
    return NextResponse.json({ error: "Invalid quotationId" }, { status: 400 });
  }

  // 2. Ensure quotation exists
  const quotation = await prismaClient.quotation.findUnique({
    where: { id: quotationId },
    select: { id: true },
  });
  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  // 3. Fetch all routing options for that quotation
  const routings = await prismaClient.quotationRouting.findMany({
    where: { quotationId },
    select: {
      id:           true,   // routingId
      pol:          true,
      pod:          true,
      serviceCode:  true,
      commodity:    true,
      ctrTypes:     true,   // e.g. ["20'STD","40'HC"]
      ratePerCtr:   true,
      voyageId:     true,
    },
  });

  // 4. Return them
  return NextResponse.json({ routings }, { status: 200 });
}
