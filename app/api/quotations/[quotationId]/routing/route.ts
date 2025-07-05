// File: app/api/quotations/[quotationId]/routings/route.ts

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// query params schema
const QuerySchema = z.object({
  pol:           z.string().optional(),
  pod:           z.string().optional(),
  serviceCode:   z.string().optional(),
  commodity:     z.string().optional(),
  importHaulage: z.enum(["door","terminal"]).optional(),
  page:          z.preprocess(Number, z.number().int().min(1)).default(1),
  limit:         z.preprocess(Number, z.number().int().min(1).max(100)).default(20),
  sortBy:        z.enum(["pol","pod","serviceCode","commodity","importHaulage"]).default("serviceCode"),
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
      pol:           url.searchParams.get("pol")           ?? undefined,
      pod:           url.searchParams.get("pod")           ?? undefined,
      serviceCode:   url.searchParams.get("serviceCode")   ?? undefined,
      commodity:     url.searchParams.get("commodity")     ?? undefined,
      importHaulage: url.searchParams.get("importHaulage") ?? undefined,
      page:          url.searchParams.get("page"),
      limit:         url.searchParams.get("limit"),
      sortBy:        url.searchParams.get("sortBy")        as any,
      sortOrder:     url.searchParams.get("sortOrder")     as any,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const where: any = { quotationId };
  if (q.pol)           where.pol           = { contains: q.pol, mode: "insensitive" };
  if (q.pod)           where.pod           = { contains: q.pod, mode: "insensitive" };
  if (q.serviceCode)   where.serviceCode   = q.serviceCode;
  if (q.commodity)     where.commodity     = q.commodity;
  if (q.importHaulage) where.importHaulage = q.importHaulage;

  const skip = (q.page - 1) * q.limit;
  const take = q.limit;

  const [ total, items ] = await Promise.all([
    prismaClient.quotationRouting.count({ where }),
    prismaClient.quotationRouting.findMany({
      where,
      skip,
      take,
      orderBy: { [q.sortBy]: q.sortOrder },
      select: {
        id: true,
        pol: true,
        pod: true,
        serviceCode: true,
        commodity: true,
        importHaulage: true,
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
