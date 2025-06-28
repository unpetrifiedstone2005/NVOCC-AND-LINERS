import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// Container schema
const ContainerPatchSchema = z.object({
  id: z.string().optional(), // Existing containers will have an id
  type: z.string(),
  qty: z.number().int().min(1),
  weightPerContainer: z.string(),
  weightUnit: z.enum(["kg", "lb"]),
  hsCode: z.string(),
  dangerousGoods: z.boolean(),
  imoClass: z.string().optional().nullable(),
  unNumber: z.string().optional().nullable(),
});

// Quotation PATCH schema
const PatchQuotationSchema = z.object({
  // Only allow actual quotation content fields, NOT status or metadata!
  startLocation: z.string().optional(),
  endLocation: z.string().optional(),
  pickupType: z.enum(["door", "terminal"]).optional(),
  deliveryType: z.enum(["door", "terminal"]).optional(),
  validFrom: z.string().datetime().optional(),
  commodity: z.string().optional(),
  dangerousGoods: z.boolean().optional(),
  imoClass: z.string().optional().nullable(),
  unNumber: z.string().optional().nullable(),
  shipperOwned: z.boolean().optional(),
  multipleTypes: z.boolean().optional(),
  offer: z.any().optional().nullable(),
  services: z.any().optional().nullable(),
  socDetails: z.any().optional().nullable(),
  containers: z.array(ContainerPatchSchema).optional(),
  // NO status, createdAt, updatedAt, issuedAt, etc.
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { quotationId: string } }
) {
  try {
    const data = PatchQuotationSchema.parse(await req.json());

    // 1. Fetch the quotation and check if it's in draft
    const quotation = await prismaClient.quotation.findUnique({
      where: { id: params.quotationId },
      include: { containers: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Only allow editing if the quotation is in "draft" status
    if (quotation.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft quotations can be edited" },
        { status: 400 }
      );
    }

    // 2. Prepare update data
    const { containers, ...otherFields } = data;
    const updateData: any = { ...otherFields };

    // 3. Handle container updates if provided
    if (containers) {
      const existingIds = quotation.containers.map(c => c.id);
      const incomingIds = containers.filter(c => c.id).map(c => c.id);

      // Containers to delete: in DB but not in incoming
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));

      updateData.containers = {
        deleteMany: toDelete.length > 0 ? { id: { in: toDelete } } : undefined,
        update: containers
          .filter(c => c.id)
          .map(c => ({
            where: { id: c.id },
            data: {
              type: c.type,
              qty: c.qty,
              weightPerContainer: parseFloat(c.weightPerContainer),
              weightUnit: c.weightUnit,
              hsCode: c.hsCode,
              dangerousGoods: c.dangerousGoods,
              imoClass: c.imoClass,
              unNumber: c.unNumber,
            },
          })),
        create: containers
          .filter(c => !c.id)
          .map(c => ({
            type: c.type,
            qty: c.qty,
            weightPerContainer: parseFloat(c.weightPerContainer),
            weightUnit: c.weightUnit,
            hsCode: c.hsCode,
            dangerousGoods: c.dangerousGoods,
            imoClass: c.imoClass,
            unNumber: c.unNumber,
          })),
      };
    }

    // 4. Update the quotation
    const updatedQuotation = await prismaClient.quotation.update({
      where: { id: params.quotationId },
      data: updateData,
      include: { containers: true },
    });

    return NextResponse.json(updatedQuotation, { status: 200 });
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
