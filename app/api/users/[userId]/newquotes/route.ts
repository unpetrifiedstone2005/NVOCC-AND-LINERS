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

    // 1️⃣ Find weight bracket (if any)
    const bracket = rateSheet.weightBrackets.find(
      wb => weightKg >= wb.minWeightKg && weightKg <= wb.maxWeightKg
    );

    // 2️⃣ Calculate base rate or bracket rate
    let base = new Prisma.Decimal(rateSheet.baseRate);
    let bracketRate = new Prisma.Decimal(0);

    if (bracket && bracket.ratePerKg && Number(bracket.ratePerKg) > 0) {
      base = new Prisma.Decimal(bracket.ratePerKg).mul(weightKg);
    }

    // 3️⃣ Overweight calculation (if enabled in your model)
    let overweightCharge = new Prisma.Decimal(0);
    if (
      rateSheet.includedWeightKg &&
      rateSheet.overweightRatePerKg &&
      weightKg > rateSheet.includedWeightKg
    ) {
      const overweight = weightKg - rateSheet.includedWeightKg;
      overweightCharge = new Prisma.Decimal(rateSheet.overweightRatePerKg).mul(overweight);
    }

    // 4️⃣ Surcharges
    let surchargeTotal = rateSheet.surcharges.reduce(
      (sum, s) => sum.add(new Prisma.Decimal(s.amount)),
      new Prisma.Decimal(0)
    );

    // 5️⃣ Container total
    const containerTotal = base
      .add(overweightCharge)
      .add(surchargeTotal)
      .mul(container.qty);

    total = total.add(containerTotal);

    details.push({
      type: container.type,
      qty: container.qty,
      base: base.toFixed(2),
      bracketRate: bracket ? bracketRate.toFixed(2) : undefined,
      overweight: overweightCharge.gt(0) ? overweightCharge.toFixed(2) : undefined,
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
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const data: CreateQuotationInput = CreateQuotationSchema.parse(await req.json());

    // 1. Calculate offer using updated logic
    const offer = await calculateOffer(data);

    // 2. Determine status
    let status: QuotationStatus = QuotationStatus.accepted;
    if (data.dangerousGoods) {
      status = QuotationStatus.pending_response;
    }
    // (Add more rules for other exceptions as needed)

    // 3. Create the quotation and its containers, then the document
    const result = await prismaClient.$transaction(async (tx) => {
      // Create Quotation
      const quotation = await tx.quotation.create({
        data: {
          userId: params.userId, // Use userId from URL
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
          status,
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
          },
        },
        include: {
          containers: true,
          user: true,
        },
      });

      // Create Document for this Quotation
      const document = await tx.document.create({
        data: {
          type: "QUOTATION",
          url: "", // Set this if you generate a file, else leave as empty string
          quotationId: quotation.id,
        },
      });

      return { quotation, document };
    });

    return NextResponse.json(result, { status: 201 });
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
