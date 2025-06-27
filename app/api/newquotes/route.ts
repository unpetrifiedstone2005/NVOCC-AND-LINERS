import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { Prisma, QuotationStatus } from "@prisma/client";

// --- Schemas ---
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

// --- Offer Calculation Helper ---
async function calculateOffer(input: CreateQuotationInput) {
  const rates = await prismaClient.rateSheet.findMany({
    where: {
      originPortId: input.startLocation,
      destinationPortId: input.endLocation,
      containerType: { in: input.containers.map(c => c.type) },
      validFrom: { lte: new Date(input.validFrom) },
      validTo: { gte: new Date(input.validFrom) },
    },
    include: {
      weightBrackets: true,
      surcharges: true,
    },
  });

  let total = new Prisma.Decimal(0);
  let details: any[] = [];

  for (const container of input.containers) {
    const rateSheet = rates.find(r => r.containerType === container.type);
    if (!rateSheet) {
      details.push({ type: container.type, error: "No rate found" });
      continue;
    }

    const weightKg = parseFloat(container.weightPerContainer);
    const bracket = rateSheet.weightBrackets.find(
      wb => weightKg >= wb.minWeightKg && weightKg <= wb.maxWeightKg
    );

    let rate = new Prisma.Decimal(rateSheet.baseRate);
    if (bracket) {
      rate = new Prisma.Decimal(bracket.ratePerKg).mul(weightKg);
    }

    let surchargeTotal = rateSheet.surcharges.reduce(
      (sum, s) => sum.add(new Prisma.Decimal(s.amount)),
      new Prisma.Decimal(0)
    );

    const containerTotal = rate.add(surchargeTotal).mul(container.qty);

    total = total.add(containerTotal);

    details.push({
      type: container.type,
      qty: container.qty,
      base: rate.toFixed(2),
      surcharges: surchargeTotal.toFixed(2),
      total: containerTotal.toFixed(2),
    });
  }

  return {
    total: total.toFixed(2),
    currency: rates[0]?.currency || "USD",
    details,
  };
}

// --- Main Endpoint ---
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data: CreateQuotationInput = CreateQuotationSchema.parse(await req.json());

    // 1. Calculate offer
    const offer = await calculateOffer(data);

    // 2. Determine status
    let status: QuotationStatus = QuotationStatus.accepted;
    if (data.dangerousGoods) {
      status = QuotationStatus.pending_response;
    }
    // (Add more rules for other exceptions as needed)

    // 3. Create the quotation (including containers)
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
        offer,
        services: data.services,
        status, // <-- Set status based on business logic
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
