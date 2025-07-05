// app/api/booking/[bookingId]/si/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// Minimal Zod schema for SI payload
const CreateSISchema = z.object({
  consignee:        z.string().min(1),
  placeOfReceipt:   z.string().min(1),
  portOfLoading:    z.string().min(1),
  portOfDischarge:  z.string().min(1),
  finalDestination: z.string().min(1),
  vesselName:       z.string().optional(),
  voyageNumber:     z.string().optional(),
  specialRemarks:   z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  // Validate bookingId format
  const { bookingId } = params;
  if (!/^[0-9a-fA-F-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // Parse & validate the request body
  let data: z.infer<typeof CreateSISchema>;
  try {
    data = CreateSISchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    throw err;
  }

  // Create the ShippingInstruction using bookingId directly
  try {
    const si = await prismaClient.shippingInstruction.create({
      data: {
        bookingId,
        consignee:        data.consignee,
        placeOfReceipt:   data.placeOfReceipt,
        portOfLoading:    data.portOfLoading,
        portOfDischarge:  data.portOfDischarge,
        finalDestination: data.finalDestination,
        vesselName:       data.vesselName,
        voyageNumber:     data.voyageNumber,
        specialRemarks:   data.specialRemarks,
      },
    });
    return NextResponse.json(si, { status: 201 });
  } catch (err) {
    console.error("Error creating SI:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
