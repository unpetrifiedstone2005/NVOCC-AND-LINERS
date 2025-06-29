import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const EditableBLDraftFields = z.object({
  shipper: z.string().optional(),
  shippersReference: z.string().optional(),
  carriersReference: z.string().optional(),
  uniqueConsignmentRef: z.string().optional(),
  consignee: z.string().optional(),
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
  containerNumbers: z.string().optional(),
  sealNumbers: z.string().optional(),
  sizeType: z.string().optional(),
  totalNoOfContainersText: z.string().optional(),
  incoterms2020: z.string().optional(),
  freightCharges: z.string().optional(),
  termsAndConditions: z.string().optional()
}).partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { documentNo: string } }
) {
  try {
    const data = EditableBLDraftFields.parse(await req.json());
    const { documentNo } = params;

    // Prepare update object
    const updateData = {
      ...data,
      ...(data.shippedOnBoardDate
        ? { shippedOnBoardDate: new Date(data.shippedOnBoardDate) }
        : {}),
    };

    // 1. Update the B/L draft
    const updated = await prismaClient.bLDraft.update({
      where: { documentNo },
      data: updateData,
    });

    // 2. Fetch all related containers for this booking
    const containersRaw = await prismaClient.bookingContainer.findMany({
      where: { bookingId: updated.bookingId },
      select: {
        id: true,
        type: true,
        qty: true,
        shipperOwned: true,
        cargoDescription: true,
        hsCode: true,
        weight: true,
        weightUnit: true,
        dangerousGoods: true,
        imoClass: true,
        unNumber: true,
        releaseDate: true,
        releaseTime: true,
      },
    });

    // 3. Optionally, map/rename fields for the snapshot
    const containers = containersRaw.map(c => ({
      id: c.id,
      sizeType: c.type, // Renamed for snapshot
      qty: c.qty,
      shipperOwned: c.shipperOwned,
      descriptionOfGoods: c.cargoDescription,
      hsCode: c.hsCode,
      grossWeightKg: c.weight, // Assuming 'grossWeightKg' in snapshot
      weightUnit: c.weightUnit,
      dangerousGoods: c.dangerousGoods,
      imoClass: c.imoClass,
      unNumber: c.unNumber,
      releaseDate: c.releaseDate,
      releaseTime: c.releaseTime,
    }));

    // 4. Build a full snapshot with all details
    const fullSnapshot = {
      ...updated,
      containers,
    };

    // 5. Create a new BLDraftVersion snapshot
    await prismaClient.bLDraftVersion.create({
      data: {
        draftNo: updated.documentNo,
        snapshot: fullSnapshot,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
