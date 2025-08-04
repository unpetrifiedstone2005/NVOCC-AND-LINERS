import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// request body schema
const RateInput = z.object({
  containerTypeIsoCode: z.string(),
  amount:               z.string().regex(/^\d+(\.\d{1,2})?$/)
});

const CreateDefSchema = z.object({
  name:          z.string(),
  scope:         z.enum(["ORIGIN","FREIGHT","DESTINATION"]),
  portCode:      z.string().optional(),
  serviceCode:   z.string().optional(),
  isPercentage:  z.boolean().default(false),
  currency:      z.string().default("USD"),
  effectiveFrom: z.string().datetime(),
  effectiveTo:   z.string().datetime().optional(),
  // rates now fully optional; if provided, must match RateInput array
  rates:         z.array(RateInput).optional(),
});

export async function POST(req: Request) {
  try {
    const body = CreateDefSchema.parse(await req.json());
    // Build data object
    const data: any = {
      name:          body.name,
      scope:         body.scope,
      portCode:      body.portCode,
      serviceCode:   body.serviceCode,
      isPercentage:  body.isPercentage,
      currency:      body.currency,
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo:   body.effectiveTo ? new Date(body.effectiveTo) : undefined,
    };

    // Only include rates if provided
    if (body.rates) {
      data.rates = {
        create: body.rates.map(r => ({
          containerTypeIsoCode: r.containerTypeIsoCode,
          amount:               parseFloat(r.amount),
        }))
      };
    }

    const def = await prismaClient.surchargeDef.create({
      data,
      include: { rates: true }
    });

    return NextResponse.json(def, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
