// File: app/api/seed/tariffs/[id]/patch/route.ts
import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // <— note Promise<…>
) {
  try {
    // ① await the params promise
    const { id } = await params;

    // ② parse body
    const { validFrom, validTo, rates } = await req.json();

    // Basic date validation
    const fromDate = new Date(validFrom);
    if (isNaN(fromDate.getTime())) {
      return NextResponse.json({ error: `"validFrom" is invalid` }, { status: 400 });
    }

    let toDate: Date | null = null;
    if (validTo) {
      toDate = new Date(validTo);
      if (isNaN(toDate.getTime())) {
        return NextResponse.json({ error: `"validTo" is invalid` }, { status: 400 });
      }
      if (toDate <= fromDate) {
        return NextResponse.json(
          { error: `"validTo" must be after "validFrom"` },
          { status: 400 }
        );
      }
    }

    // ③ perform the update
    const updated = await prismaClient.tariff.update({
      where: { id },
      data: {
        validFrom: fromDate,
        validTo:   toDate,
        rates: {
          deleteMany: {},
          create: rates.map((r: { containerType: string; amount: number }) => ({
            containerType: r.containerType,
            amount:        r.amount,
          })),
        },
      },
      include: {
        schedule: { select: { code: true, description: true } },
        voyage:   { select: { voyageNumber: true } },
        rates:    true,
      },
    });

    return NextResponse.json({ tariff: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /seed/tariffs/[id]/patch error", err);
    return NextResponse.json(
      { error: err.message || "Failed to update tariff" },
      { status: 500 }
    );
  }
}
