import { prismaClient } from "@/app/lib/db";
import { DraftStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// Operator-editable fields (per your workflow)
const EditableBLDraftFields = z.object({
  shipper: z.string().optional(),
  exportReferences: z.string().optional().nullable(),
  consignee: z.string().optional(),
  notifyAddress: z.string().optional().nullable(),
  forwardingAgent: z.string().optional().nullable(),
  consigneesReference: z.string().optional().nullable(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  placeOfReceipt: z.string().optional().nullable(),
  placeOfDelivery: z.string().optional().nullable(),
  placeOfIssue: z.string().optional(),
  dateOfIssue: z.string().optional(),
  freightPayableAt: z.string().optional(),
  documentType: z.string().optional(),
  numberOfFreightedOriginalBLs: z.number().optional(),
  numberOfFreightedCopies: z.number().optional(),
  numberOfUnfreightedOriginalBLs: z.number().optional(),
  numberOfUnfreightedCopies: z.number().optional(),
  generalComment: z.string().optional().nullable(),

  cargo: z.array(z.object({
    cargoId: z.string().optional(),
    containerId: z.string().optional(), 
    grossWeight: z.number().optional(),
    grossVolume: z.number().optional(),
    noOfPackages: z.number().optional(),
    netWeight: z.number().optional(),
    netVolume: z.number().optional(),
    hsCode: z.string(),
    description: z.string(),
    marksAndNumbers: z.string().optional().nullable(),
    outerPacking: z.string().optional().nullable(),
    sealNo: z.string().optional().nullable(),
    sealNoOptional: z.string().optional().nullable(),
    customerLoadReference: z.string().optional().nullable(),
  })).optional(),
}).partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { documentNo: string } }
) {
  try {
    const data = EditableBLDraftFields.parse(await req.json());
    const { documentNo } = params;

    // Fetch current draft, containers, and booking
    const currentDraft = await prismaClient.bLDraft.findUnique({
      where: { documentNo },
      include: {
        containers: { include: { cargoes: true } },
        booking: { include: { containers: true } },
      },
    });
    if (!currentDraft) {
      return NextResponse.json({ error: "B/L draft not found" }, { status: 404 });
    }
    const booking = currentDraft.booking;
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Handle cargo edits
    if (data.cargo) {
      const draftContainers = await prismaClient.bLDraftContainer.findMany({
        where: { bLDraftId: documentNo },
      });
      const defaultContainerId = draftContainers[0]?.id;

      for (const c of data.cargo) {
        if (c.cargoId) {
          await prismaClient.bLDraftCargo.update({
            where: { id: c.cargoId },
            data: {
              grossWeight: c.grossWeight,
              grossVolume: c.grossVolume,
              noOfPackages: c.noOfPackages,
              netWeight: c.netWeight,
              netVolume: c.netVolume,
              hsCode: c.hsCode,
              description: c.description,
              marksAndNumbers: c.marksAndNumbers,
              outerPacking: c.outerPacking,
              sealNo: c.sealNo,
              sealNoOptional: c.sealNoOptional,
              customerLoadReference: c.customerLoadReference,
            },
          });
        } else {
          const containerId = c.containerId ?? defaultContainerId;
          if (!containerId) {
            return NextResponse.json(
              { error: "No container available for new cargo" },
              { status: 400 }
            );
          }
          await prismaClient.bLDraftCargo.create({
            data: {
              containerId,
              grossWeight: c.grossWeight,
              grossVolume: c.grossVolume,
              noOfPackages: c.noOfPackages,
              netWeight: c.netWeight,
              netVolume: c.netVolume,
              hsCode: c.hsCode,
              description: c.description,
              marksAndNumbers: c.marksAndNumbers,
              outerPacking: c.outerPacking,
              sealNo: c.sealNo,
              sealNoOptional: c.sealNoOptional,
              customerLoadReference: c.customerLoadReference,
            },
          });
        }
      }
    }

    // Recalculate totals
    const updatedContainers = await prismaClient.bLDraftContainer.findMany({
      where: { bLDraftId: documentNo },
      include: { cargoes: true },
    });

    let totalNoOfPackages = 0;
    let totalGrossWeight = 0;
    let totalGrossVolume = 0;

    for (const container of updatedContainers) {
      for (const cargo of container.cargoes) {
        totalNoOfPackages += cargo.noOfPackages ?? 0;
        totalGrossWeight += cargo.grossWeight ?? 0;
        totalGrossVolume += cargo.grossVolume ?? 0;
      }
    }

    // Calculate allowed totals
    const bookingContainers = booking.containers;
    const containerTypeNames = bookingContainers.map(bc => bc.type);
    const containerTypeSpecs = await prismaClient.containerTypeSpec.findMany({
      where: { type: { in: containerTypeNames } },
    });

    let allowedGrossWeight = 0;
    let allowedVolume = 0;
    for (const bc of bookingContainers) {
      const typeSpec = containerTypeSpecs.find(ct => ct.type === bc.type);
      if (!typeSpec) continue;
      allowedGrossWeight += Number(typeSpec.maxStackWeightKg) * bc.qty;
      const volumePerContainer =
        (typeSpec.lengthMm * typeSpec.widthMm * typeSpec.heightMm) / 1_000_000_000;
      allowedVolume += volumePerContainer * bc.qty;
    }

    // Check if cargo exceeds booking container capacity
    let draftStatus = currentDraft.status;
    let exceeds = false;
    if (
      totalGrossWeight > allowedGrossWeight ||
      totalGrossVolume > allowedVolume
    ) {
      draftStatus = DraftStatus.EXCEEDS_CAPACITY;
      exceeds = true;
    } else {
      // Check if price-affecting fields changed
      const priceFields = [
        "portOfLoading",
        "portOfDischarge",
        "carrierName",
        "serviceContractNumber",
        "placeOfReceipt",
        "placeOfDelivery",
      ];
      const priceFieldChanged = priceFields.some(
        (field) =>
          Object.prototype.hasOwnProperty.call(data, field) &&
          data[field as keyof typeof data] !== (currentDraft as any)[field]
      );
      if (priceFieldChanged) {
        draftStatus = DraftStatus.PRICE_CHANGE_PENDING;
      }
    }

    // Update BL draft
    const updatedDraft = await prismaClient.bLDraft.update({
      where: { documentNo },
      data: {
        ...data,
        status: draftStatus,
      },
    });

    // Add a version snapshot
    const snapshot = await prismaClient.bLDraft.findUniqueOrThrow({
      where: { documentNo },
      include: {
        containers: { include: { cargoes: true } },
      },
    });
    await prismaClient.bLDraftVersion.create({
      data: {
        draftNo: snapshot.documentNo,
        snapshot: snapshot,
      },
    });

    return NextResponse.json(
      {
        draft: updatedDraft,
        versioned: true,
        status: draftStatus,
        exceeds,
        allowed: {
          allowedGrossWeight,
          allowedVolume,
        },
        totals: {
          totalNoOfPackages,
          totalGrossWeight,
          totalGrossVolume,
        },
      },
      { status: 200 }
    );
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
