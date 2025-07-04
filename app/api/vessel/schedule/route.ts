import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { Prisma, QuotationStatus, Surcharge } from "@prisma/client";
import { differenceInDays } from "date-fns";

const BASE_URL = "http://localhost:3000"; // change if needed

const QuotationServiceSchema = z.object({
  serviceId: z.string(),
  qty: z.number().int().min(1),
});

const CreateQuotationSchema = z.object({
  containerTypeGroup: z.string(),
  startLocation: z.string(),
  startIsPort: z.boolean(),
  endLocation: z.string(),
  endIsPort: z.boolean(),
  pickupType: z.enum(["door", "terminal"]),
  deliveryType: z.enum(["door", "terminal"]),
  validFrom: z.string().datetime(),
  services: z.array(QuotationServiceSchema).optional().nullable(),
  commodity: z.string(),
  shipperOwned: z.boolean(),
  multipleTypes: z.boolean(),
  offer: z.any().optional().nullable(),
});

type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const data: CreateQuotationInput = CreateQuotationSchema.parse(await req.json());
    const quoteDate = new Date(data.validFrom);

    const containerTypes = await prismaClient.containerType.findMany({
      where: { name: { contains: data.containerTypeGroup } },
    });

    if (containerTypes.length === 0) {
      throw new Error("No matching container types found for group.");
    }

    let offerDetails: any[] = [];
    let currency = "USD";

    for (const type of containerTypes) {
      const res = await fetch(
        `${BASE_URL}/api/seed/ratesheets/get?containerTypeId=${type.id}&startLocation=${data.startLocation}&endLocation=${data.endLocation}&validFrom=${data.validFrom}&validTo=${data.validFrom}&includeSurcharges=true`
      );

      const rateRes = await res.json();
      const rateSheet = rateRes.data?.[0];

      if (!rateSheet) {
        throw new Error(`No rate sheet found for container type ${type.name}`);
      }

      currency = rateSheet.currency;

      offerDetails.push({
        containerType: type.name,
        baseRate: rateSheet.baseRate,
        currency: rateSheet.currency,
        surcharges: rateSheet.surcharges.map((s: Surcharge) => ({
          type: s.surchargeType,
          scope: s.scope,
          amount: s.amount,
          currency: s.currency,
          isPercentage: s.isPercentage,
          appliesToDG: s.appliesToDG,
        })),
      });
    }

    // 🔄 Transit Time Fetch (Vessel Schedule)
    const etdFetch = await fetch(
      `${BASE_URL}/api/vessel/schedule?page=1&limit=1` +
        `&portOfCallId=${data.startLocation}` +
        `&operationType=LOAD` +
        `&etdFrom=${data.validFrom}` +
        `&sortBy=etd&sortOrder=asc`
    );

    const etdJson = await etdFetch.json();
    const loadCall = etdJson.data?.[0];
    if (!loadCall) throw new Error("No vessel schedule (ETD) found for origin.");

    const etaFetch = await fetch(
      `${BASE_URL}/api/vessel/schedule?page=1&limit=1` +
        `&vesselId=${loadCall.vesselId}` +
        `&voyageNumber=${loadCall.voyageNumber}` +
        `&portOfCallId=${data.endLocation}` +
        `&operationType=DISCHARGE` +
        `&sortBy=eta&sortOrder=asc`
    );

    const etaJson = await etaFetch.json();
    const dischargeCall = etaJson.data?.[0];
    if (!dischargeCall) throw new Error("No vessel schedule (ETA) found for destination.");

    const transitTime = differenceInDays(new Date(dischargeCall.eta), new Date(loadCall.etd));

    const transit = {
      vessel: loadCall.vessel.name,
      voyageNumber: loadCall.voyageNumber,
      etd: loadCall.etd,
      eta: dischargeCall.eta,
      days: transitTime,
    };

    // 🔢 Add-ons (Services)
    let addonsTotal = new Prisma.Decimal(0);
    let addonDetails: any[] = [];

    if (data.services && data.services.length > 0) {
      const serviceDefs = await prismaClient.service.findMany({
        where: {
          id: { in: data.services.map(s => s.serviceId) },
        },
      });

      for (const svc of data.services) {
        const def = serviceDefs.find(d => d.id === svc.serviceId);
        if (!def) continue;
        const svcTotal = new Prisma.Decimal(def.ratePerUnit).mul(svc.qty);
        addonsTotal = addonsTotal.add(svcTotal);
        addonDetails.push({
          name: def.name,
          qty: svc.qty,
          unitRate: def.ratePerUnit,
          total: svcTotal.toFixed(2),
        });
      }
    }

    const quotation = await prismaClient.quotation.create({
      data: {
        userId: params.userId,
        startLocation: data.startLocation,
        startIsPort: data.startIsPort,
        endLocation: data.endLocation,
        endIsPort: data.endIsPort,
        pickupType: data.pickupType,
        deliveryType: data.deliveryType,
        validFrom: quoteDate,
        commodity: data.commodity,
        shipperOwned: data.shipperOwned,
        multipleTypes: data.multipleTypes,
        containerCategory: data.containerTypeGroup as any, // adapt if enum
        status: QuotationStatus.accepted,
        offer: {
          currency,
          baseRates: offerDetails,
          transit,
        },
      },
    });

    return NextResponse.json(
      {
        quotation,
        addons: addonDetails,
        grandTotal: addonsTotal.toFixed(2),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: "Server Error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
