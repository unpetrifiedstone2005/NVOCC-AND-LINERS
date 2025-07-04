// File: app/api/surcharges/[id]/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const RatePatch = z.object({
  id:                   z.string().uuid().optional(),
  containerTypeIsoCode: z.string(),
  amount:               z.string().regex(/^\d+(\.\d{1,2})?$/)
});

const UpdateDefSchema = z.object({
  name:          z.string().optional(),
  scope:         z.enum(["ORIGIN","FREIGHT","DESTINATION"]).optional(),
  portCode:      z.string().optional(),
  serviceCode:   z.string().optional(),
  isPercentage:  z.boolean().optional(),
  currency:      z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo:   z.string().datetime().optional().nullable(),
  rates:         z.array(RatePatch).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  try {
    const defId = params.id;
    const body = UpdateDefSchema.parse(await req.json());

    // Prepare rate mutations
    let rateOps: any = {};
    if (body.rates) {
      const incomingIds = body.rates.filter(r => r.id).map(r => r.id);
      rateOps = {
        deleteMany: {
          id: { notIn: incomingIds }
        },
        update: body.rates.filter(r => r.id).map(r => ({
          where: { id: r.id! },
          data:  { 
            containerTypeIsoCode: r.containerTypeIsoCode,
            amount:               parseFloat(r.amount)
          }
        })),
        create: body.rates.filter(r => !r.id).map(r => ({
          containerTypeIsoCode: r.containerTypeIsoCode,
          amount:               parseFloat(r.amount)
        }))
      };
    }

    const updated = await prismaClient.surchargeDef.update({
      where: { id: defId },
      data: {
        name:          body.name,
        scope:         body.scope,
        portCode:      body.portCode,
        serviceCode:   body.serviceCode,
        isPercentage:  body.isPercentage,
        currency:      body.currency,
        effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : undefined,
        effectiveTo:   body.effectiveTo !== undefined
                        ? (body.effectiveTo ? new Date(body.effectiveTo) : null)
                        : undefined,
        ...(body.rates ? { rates: rateOps } : {})
      },
      include: { rates: true }
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
