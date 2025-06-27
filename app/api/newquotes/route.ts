import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const QuotationContainerSchema = z.object({
  type: z.string(),
  qty: z.number().int().min(1),
  weightPerContainer: z.string(),
  weightUnit: z.enum(["kg", "lb"]),
  hsCode: z.string(),
  dangerousGoods: z.boolean(),
  imoClass: z.string().optional().nullable(),
  unNumber: z.string().optional().nullable(),
});

const CreateQuotationSchema = z.object({
  userId: z.string(),
  startLocation: z.string(),
  endLocation: z.string(),
  pickupType: z.enum(["door", "terminal"]),
  deliveryType: z.enum(["door", "terminal"]),
  validFrom: z.string().datetime(),
  containers: z.array(QuotationContainerSchema),
  commodity: z.string(),
  dangerousGoods: z.boolean(),
  imoClass: z.string().optional().nullable(),
  unNumber: z.string().optional().nullable(),
  shipperOwned: z.boolean(),
  multipleTypes: z.boolean(),
  offer: z.any().optional().nullable(),
  services: z.any().optional().nullable(),
});

type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data: CreateQuotationInput = CreateQuotationSchema.parse(await req.json());

    const quotation = await prismaClient.quotation.create({
      data: {
        userId: data.userId,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        pickupType: data.pickupType,
        deliveryType: data.deliveryType,
        validFrom: new Date(data.validFrom),
        commodity: data.commodity,
        dangerousGoods: data.dangerousGoods,
        imoClass: data.imoClass,
        unNumber: data.unNumber,
        shipperOwned: data.shipperOwned,
        multipleTypes: data.multipleTypes,
        offer: data.offer,
        services: data.services,
        containers: {
          create: data.containers.map((container) => ({
            type: container.type,
            qty: container.qty,
            weightPerContainer: parseFloat(container.weightPerContainer),
            weightUnit: container.weightUnit,
            hsCode: container.hsCode,
            dangerousGoods: container.dangerousGoods,
            imoClass: container.imoClass,
            unNumber: container.unNumber,
          })),
        }
      },
      include: {
        containers: true,
        user: true,
      }
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json(
        { error: "Server Error", details: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Server Error", details: "Unknown error" },
      { status: 500 }
    );
  }
}
