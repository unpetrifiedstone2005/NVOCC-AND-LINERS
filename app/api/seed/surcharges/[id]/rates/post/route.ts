import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@/app/lib/db";

const RateInput = z.object({
  containerTypeIsoCode: z.string(),
  amount:               z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = RateInput.parse(await req.json());
    const { id: surchargeDefId } = await params;

    const rate = await prismaClient.surchargeRate.create({
      data: {
        surchargeDefId,
        containerTypeIsoCode: body.containerTypeIsoCode,
        amount: new Prisma.Decimal(body.amount),
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
