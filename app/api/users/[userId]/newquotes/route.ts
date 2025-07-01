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
});

const CargoSchema = z.object({
  hsCode: z.string(),
  dangerousGoods: z.boolean(),
  imoClass: z.string().optional().nullable(),
  unNumber: z.string().optional().nullable(),
  packingGroup: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const ContainerWithCargoSchema = z.object({
  type: z.string(),
  qty: z.number().int().min(1),
  weightPerContainer: z.string(),
  weightUnit: z.enum(["kg", "lb"]),
  cargo: CargoSchema,
});

const CreateQuotationSchema = z.object({
  startLocation: z.string(),
  endLocation: z.string(),
  pickupType: z.enum(["door", "terminal"]),
  deliveryType: z.enum(["door", "terminal"]),
  validFrom: z.string().datetime(),
  containers: z.array(ContainerWithCargoSchema),
  commodity: z.string(),
  shipperOwned: z.boolean(),
  multipleTypes: z.boolean(),
  offer: z.any().optional().nullable(),
  services: z.any().optional().nullable(),
});

type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

async function calculateOffer(input: CreateQuotationInput) {
  let total = new Prisma.Decimal(0);
  let details: any[] = [];

  for (const container of input.containers) {
    const rateSheet = await prismaClient.rateSheet.findFirst({
      where: {
        originPortId: input.startLocation,
        destinationPortId: input.endLocation,
        containerType: container.type,
        isDangerousGoods: container.cargo.dangerousGoods,
        validFrom: { lte: new Date(input.validFrom) },
        validTo: { gte: new Date(input.validFrom) },
      },
      include: {
        weightBrackets: true,
        surcharges: true,
      },
    });

    if (!rateSheet) {
      details.push({ type: container.type, error: "No rate found" });
      continue;
    }

    const weightKg = parseFloat(container.weightPerContainer);

    // Find weight bracket
    const bracket = rateSheet.weightBrackets.find(
      wb => weightKg >= wb.minWeightKg && weightKg <= wb.maxWeightKg
    );

    // Calculate base rate or bracket rate
    let base = new Prisma.Decimal(rateSheet.baseRate);
    if (bracket && bracket.ratePerKg && Number(bracket.ratePerKg) > 0) {
      base = new Prisma.Decimal(bracket.ratePerKg).mul(weightKg);
    }

    // Overweight calculation
    let overweightCharge = new Prisma.Decimal(0);
    if (
      rateSheet.includedWeightKg &&
      rateSheet.overweightRatePerKg &&
      weightKg > rateSheet.includedWeightKg
    ) {
      const overweight = weightKg - rateSheet.includedWeightKg;
      overweightCharge = new Prisma.Decimal(rateSheet.overweightRatePerKg).mul(overweight);
    }

    // Surcharges (only apply if not dangerous or if surcharge applies to DG)
    let surchargeTotal = rateSheet.surcharges.reduce(
      (sum, s) => {
        if (!container.cargo.dangerousGoods || s.appliesToDG) {
          return sum.add(new Prisma.Decimal(s.amount));
        }
        return sum;
      },
      new Prisma.Decimal(0)
    );

    // Container total
    const containerTotal = base
      .add(overweightCharge)
      .add(surchargeTotal)
      .mul(container.qty);

    total = total.add(containerTotal);

    details.push({
      type: container.type,
      qty: container.qty,
      base: base.toFixed(2),
      bracketRate: bracket ? base.toFixed(2) : undefined,
      overweight: overweightCharge.gt(0) ? overweightCharge.toFixed(2) : undefined,
      surcharges: surchargeTotal.toFixed(2),
      total: containerTotal.toFixed(2),
    });
  }

  return {
    total: total.toFixed(2),
    currency: "USD",
    details,
  };
}

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
    if (data.containers.some(c => c.cargo.dangerousGoods)) {
      status = QuotationStatus.pending_response;
    }

    // 3. Create the quotation, containers, and cargo records
    const result = await prismaClient.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          userId: params.userId,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          pickupType: data.pickupType,
          deliveryType: data.deliveryType,
          validFrom: new Date(data.validFrom),
          commodity: data.commodity,
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
            })),
          },
        },
        include: {
          containers: true,
          user: true,
        },
      });

      for (const container of data.containers) {
        await tx.cargo.create({
          data: {
            quotationId: quotation.id,
            containerId: quotation.containers.find(c => c.type === container.type && c.qty === container.qty)?.id,
            hsCode: container.cargo.hsCode,
            description: container.cargo.description || data.commodity,
            isDangerous: container.cargo.dangerousGoods,
            imoClass: container.cargo.imoClass || null,
            unNumber: container.cargo.unNumber || null,
            packingGroup: container.cargo.packingGroup || null,
          },
        });
      }

      const document = await tx.document.create({
        data: {
          type: "QUOTATION",
          url: "",
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
