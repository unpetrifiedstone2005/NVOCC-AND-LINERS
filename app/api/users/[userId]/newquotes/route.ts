// File: app/api/quotations/[userId]/route.ts

import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { Prisma, QuotationStatus } from "@prisma/client";

// 1) Validation schemas
const QuotationContainerSchema = z.object({
  type:               z.string(),             
  qty:                z.number().int().min(1),
  weightPerContainer: z.string(),
  weightUnit:         z.enum(["kg","lb"]),
  services:           z.array(z.object({
                        serviceId: z.string(),
                        qty:       z.number().int().min(1),
                      })).optional().nullable(),
});

const CreateQuotationSchema = z.object({
  containers:    z.array(QuotationContainerSchema).min(1),
  startLocation: z.string(),
  startIsPort:   z.boolean(),
  endLocation:   z.string(),
  endIsPort:     z.boolean(),
  pickupType:    z.enum(["door","terminal"]),
  deliveryType:  z.enum(["door","terminal"]),
  validFrom:     z.string().datetime(),
  commodity:     z.string(),
  shipperOwned:  z.boolean(),
  multipleTypes: z.boolean(),
  offer:         z.any().optional().nullable(),
});

type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 2.1 Parse & validate
    const data: CreateQuotationInput = CreateQuotationSchema.parse(await req.json());
    const quoteDate = new Date(data.validFrom);

    // 2.2 Load ContainerTypes
    const containerTypes = await prismaClient.containerType.findMany({
      where: { name: { in: data.containers.map(c => c.type) } }
    });
    if (containerTypes.length !== data.containers.length) {
      throw new Error("One or more container types not found.");
    }

    // helper to fetch JSON
    const fetchJson = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${url}`);
      return res.json();
    };

    // 2.3 Compute per-container offer & build create data
    const offerDetails: any[] = [];
    const quotationContainersData = await Promise.all(
      data.containers.map(async (c) => {
        const type = containerTypes.find(t => t.name === c.type)!;
        const teuFactor = new Prisma.Decimal(type.teuFactor);

        // a) Base tariff
        const tariffURL = new URL("/api/tariffs", req.url);
        tariffURL.searchParams.set("commodity",   data.commodity);
        tariffURL.searchParams.append("serviceCodes","OCEAN");
        tariffURL.searchParams.append("groups",      type.group);
        tariffURL.searchParams.append("pol",         data.startLocation);
        tariffURL.searchParams.append("pod",         data.endLocation);
        tariffURL.searchParams.append("pageSize",    "1");
        const { items:[tariff] } = await fetchJson(tariffURL.toString());
        if (!tariff) throw new Error("No tariff found");
        const baseRate = new Prisma.Decimal(tariff.ratePerTeu).mul(teuFactor);

        // b) Surcharges
        type SDef = { isPercentage: boolean; rates: { containerTypeIsoCode: string; amount: string }[] };
        const loadSc = async (scope: string, key: string, val: string) => {
          const u = new URL("/api/surcharges", req.url);
          u.searchParams.set("scope", scope);
          u.searchParams.set(key, val);
          u.searchParams.set("pageSize","100");
          return (await fetchJson(u.toString())).data as SDef[];
        };
        let [orig, frt, dest] = await Promise.all([
          loadSc("ORIGIN",      "portCode",    data.startLocation),
          loadSc("FREIGHT",     "serviceCode", "OCEAN"),
          loadSc("DESTINATION", "portCode",    data.endLocation),
        ]);
        if (!data.startIsPort) orig.push(...await loadSc("ORIGIN", "portCode", data.startLocation));
        if (!data.endIsPort)   dest.push(...await loadSc("DESTINATION","portCode", data.endLocation));

        const surchargeLines = [orig,frt,dest]
          .flatMap(defs => defs.flatMap(def =>
            def.rates
               .filter(r => r.containerTypeIsoCode === type.isoCode)
               .map(r => {
                 const amt = new Prisma.Decimal(r.amount);
                 return def.isPercentage
                   ? baseRate.mul(amt).div(new Prisma.Decimal(100))
                   : amt;
               })
          ));
        const surchargeTotal = surchargeLines.reduce((a,b) => a.add(b), new Prisma.Decimal(0));

        // c) Services
        let svcTotal = new Prisma.Decimal(0);
        const svcCreates: any[] = [];
        if (c.services) {
          const defs = await prismaClient.service.findMany({
            where: { id: { in: c.services.map(s => s.serviceId) } }
          });
          for (const s of c.services) {
            const d = defs.find(x=>x.id===s.serviceId)!;
            const line = new Prisma.Decimal(d.ratePerUnit).mul(new Prisma.Decimal(s.qty));
            svcTotal = svcTotal.add(line);
            svcCreates.push({
              serviceId:           s.serviceId,
              qty:                 s.qty,
              ratePerUnitSnapshot: d.ratePerUnit.toNumber(),
              currencySnapshot:    d.currency
            });
          }
        }

        // d) Transit days
        const schedURL = new URL("/api/voyages", req.url);
        schedURL.searchParams.set("pol", data.startLocation);
        schedURL.searchParams.set("pod", data.endLocation);
        schedURL.searchParams.set("from", quoteDate.toISOString());
        const { items: voyages } = await fetchJson(schedURL.toString());
        const fastest = voyages[0];
        const d0 = new Date(fastest.departure);
        const d1 = new Date(fastest.arrival ?? fastest.departure);
        const transitDays = Math.round((d1.getTime()-d0.getTime())/(1000*60*60*24));

        // e) Grand total
        const total = baseRate.add(surchargeTotal).add(svcTotal).toFixed(2);

        offerDetails.push({
          containerType: type.name,
          qty:           c.qty,
          baseRate:      baseRate.toFixed(2),
          surcharges:    surchargeLines.map(x=>x.toFixed(2)),
          transitDays,
          services:      svcCreates.map(s=>({ serviceId:s.serviceId, qty:s.qty })),
          total,
          currency:      tariff.currency
        });

        return {
          containerTypeIsoCode: type.isoCode,
          qty:                  c.qty,
          weightPerContainer:   parseFloat(c.weightPerContainer),
          weightUnit:           c.weightUnit,
          quotationContainerServices: { create: svcCreates }
        };
      })
    );

    // 2.4 Create Quotation + Containers
    const quotation = await prismaClient.quotation.create({
      data: {
        userId:               params.userId,
        startLocation:       data.startLocation,
        startIsPort:         data.startIsPort,
        endLocation:         data.endLocation,
        endIsPort:           data.endIsPort,
        pickupType:          data.pickupType,
        deliveryType:        data.deliveryType,
        validFrom:           quoteDate,
        commodity:           data.commodity,
        shipperOwned:        data.shipperOwned,
        multipleTypes:       data.multipleTypes,
        status:              QuotationStatus.accepted,
        offer: {
          currency:        offerDetails[0]?.currency ?? "USD",
          containerOffers: offerDetails
        },
        quotationContainers:{ create: quotationContainersData }
      },
      include: {
        quotationContainers:{ include:{ quotationContainerServices:true } }
      }
    });

    // 2.5 Generate Routing alternatives
    const candidateVoyages = await prismaClient.voyage.findMany({
      where: {
        departure: { gte: quoteDate },
        AND: [
          { portCalls: { some: { portCode: data.startLocation } } },
          { portCalls: { some: { portCode: data.endLocation } } }
        ]
      }
    });

    const routingData = candidateVoyages.map(v => ({
      quotationId:   quotation.id,
      pol:            data.startLocation,
      pod:            data.endLocation,
      serviceCode:    v.serviceCode,
      voyageId:       v.id,
      importHaulage:  data.pickupType,
      commodity:      data.commodity,
      ratePerCtr:     new Prisma.Decimal(0).toFixed(2) // replace with per-voyage rate if needed
    }));

    await prismaClient.quotationRouting.createMany({ data: routingData });

    const routings = await prismaClient.quotationRouting.findMany({
      where: { quotationId: quotation.id }
    });

    // 2.6 Return final payload
    return NextResponse.json({
      quotation,
      containerTotals: offerDetails.map(o => ({
        containerType: o.containerType,
        total:         o.total,
        currency:      o.currency,
        transitDays:   o.transitDays,
        surcharges:    o.surcharges
      })),
      routings
    }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({
      error:   "Server Error",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
