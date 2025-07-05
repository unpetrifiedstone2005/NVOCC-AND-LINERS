// File: app/api/quotations/[quotationId]/containers/route.ts

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const QuerySchema = z.object({
  containerType: z.string().optional(),
  weightUnit:    z.enum(["kg","lb","t"]).optional(),
  minQty:        z.preprocess(Number, z.number().int().min(0)).optional(),
  maxQty:        z.preprocess(Number, z.number().int().min(0)).optional(),
  page:          z.preprocess(Number, z.number().int().min(1)).default(1),
  limit:         z.preprocess(Number, z.number().int().min(1).max(100)).default(20),
  sortBy:        z.enum(["containerTypeIsoCode","qty","weightPerContainer"]).default("containerTypeIsoCode"),
  sortOrder:     z.enum(["asc","desc"]).default("asc"),
});

export async function GET(request: Request, { params }: { params: { quotationId: string } }) {
  const { quotationId } = params;
  if (!quotationId) {
    return NextResponse.json({ error: "quotationId is required" }, { status: 400 });
  }

  let q;
  try {
    const url = new URL(request.url);
    q = QuerySchema.parse({
      containerType: url.searchParams.get("containerType")   || undefined,
      weightUnit:    url.searchParams.get("weightUnit")      as any || undefined,
      minQty:        url.searchParams.get("minQty"),
      maxQty:        url.searchParams.get("maxQty"),
      page:          url.searchParams.get("page"),
      limit:         url.searchParams.get("limit"),
      sortBy:        url.searchParams.get("sortBy")          as any,
      sortOrder:     url.searchParams.get("sortOrder")       as any,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const where: any = { quotationId };
  if (q.containerType) where.containerTypeIsoCode = q.containerType;
  if (q.weightUnit)    where.weightUnit          = q.weightUnit;
  if (q.minQty != null) where.qty                = { gte: q.minQty };
  if (q.maxQty != null) where.qty                = { 
    ...where.qty, 
    lte: q.maxQty 
  };

  const skip = (q.page - 1) * q.limit;
  const take = q.limit;

  const [ total, items ] = await Promise.all([
    prismaClient.quotationContainer.count({ where }),
    prismaClient.quotationContainer.findMany({
      where,
      skip,
      take,
      orderBy: { [q.sortBy]: q.sortOrder },
      select: {
        id:                    true,
        containerTypeIsoCode:  true,
        qty:                   true,
        weightPerContainer:    true,
        weightUnit:            true,
      },
    })
  ]);

  return NextResponse.json({
    data: items,
    pagination: {
      total,
      page: q.page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    }
  });
}
