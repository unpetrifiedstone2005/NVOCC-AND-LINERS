// app/api/quotations/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }             from "zod";
import { prismaClient }            from "@/app/lib/db";

// 1) Shape of the “offer” JSON your front-end computes
const OfferContainerSchema = z.object({
  containerType: z.string(),
  qty:           z.number().int().min(1),
  baseRate:      z.string(),            // e.g. "1365.00"
  surcharges:    z.array(z.string()),   // e.g. ["54.00","342.00"]
  services:      z.array(z.object({     // any container-level add-ons
                    serviceId: z.string(),
                    qty:       z.number().int().min(1),
                  })),
  transitDays:   z.number().int().min(0),
  total:         z.string(),
});

const OfferSchema = z.object({
  currency:        z.string(),
  containerOffers: z.array(OfferContainerSchema).min(1),
});

// 2) Your existing container & routing schemas
const QuotationContainerSchema = z.object({
  type:               z.string(),            // ContainerType.isoCode
  qty:                z.number().int().min(1),
  weightPerContainer: z.number(),
  weightUnit:         z.enum(["kg","lb","t"]),
});

const QuotationRoutingSchema = z.object({
  pol:           z.string(),
  pod:           z.string(),
  serviceCode:   z.string(),
  voyageId:      z.string(),
  importHaulage: z.enum(["door","terminal"]),
  commodity:     z.string(),
  ratePerCtr:    z.string(),
});

// 3) Create-quotation payload now *requires* `offer`
const CreateQuotationSchema = z.object({
  startLocation:     z.string(),
  startIsPort:       z.boolean(),
  endLocation:       z.string(),
  endIsPort:         z.boolean(),
  pickupType:        z.enum(["door","terminal"]),
  deliveryType:      z.enum(["door","terminal"]),
  validFrom:         z.string().datetime(),
  commodity:         z.string(),
  shipperOwned:      z.boolean(),
  multipleTypes:     z.boolean(),

  containers:        z.array(QuotationContainerSchema).min(1),
  quotationRoutings: z.array(QuotationRoutingSchema).min(1),

  // ← the blob your UI computed and is now POSTing
  offer: OfferSchema,
});

type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

// 4) POST handler
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 4.1 Validate
    const input: CreateQuotationInput = CreateQuotationSchema.parse(
      await req.json()
    );
    const validFrom = new Date(input.validFrom);

    // 4.2 Persist quotation, containers, routings & offer
    const quotation = await prismaClient.quotation.create({
      data: {
        userId:        params.userId,
        startLocation: input.startLocation,
        startIsPort:   input.startIsPort,
        endLocation:   input.endLocation,
        endIsPort:     input.endIsPort,
        pickupType:    input.pickupType,
        deliveryType:  input.deliveryType,
        validFrom,
        commodity:     input.commodity,
        shipperOwned:  input.shipperOwned,
        multipleTypes: input.multipleTypes,
        status:        "accepted",

        // ← store the exact offer JSON here
        offer:         input.offer,

        // nested-create containers
        quotationContainers: {
          create: input.containers.map((c) => ({
            containerTypeIsoCode: c.type,
            qty:                  c.qty,
            weightPerContainer:   c.weightPerContainer,
            weightUnit:           c.weightUnit,
          })),
        },

        // nested-create routings
        quotationRoutings: {
          create: input.quotationRoutings.map((r) => ({
            pol:           r.pol,
            pod:           r.pod,
            serviceCode:   r.serviceCode,
            voyageId:      r.voyageId,
            importHaulage: r.importHaulage,
            commodity:     r.commodity,
            ratePerCtr:    r.ratePerCtr,
          })),
        },
      },
      include: {
        quotationContainers: true,
        quotationRoutings:   true,
      },
    });

    // 4.3 Return the fully populated quotation
    return NextResponse.json({ quotation }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Server Error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
