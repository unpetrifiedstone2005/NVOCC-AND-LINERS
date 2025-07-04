// File: app/api/voyages/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

const QuerySchema = z.object({
  serviceCodes: z.preprocess(
                   (val) => typeof val === "string" ? [val] : val,
                   z.array(z.string()).optional()
                 ),
  dateFrom:     z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date").optional(),
  dateTo:       z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date").optional(),
  page:         z.preprocess(Number, z.number().int().min(1)).default(1),
  pageSize:     z.preprocess(Number, z.number().int().min(1).max(100)).default(20),
});

export async function GET(request: Request) {
  let q;
  try {
    const url = new URL(request.url);
    q = QuerySchema.parse({
      serviceCodes: url.searchParams.getAll("serviceCodes"),
      dateFrom:     url.searchParams.get("dateFrom") ?? undefined,
      dateTo:       url.searchParams.get("dateTo")   ?? undefined,
      page:         url.searchParams.get("page"),
      pageSize:     url.searchParams.get("pageSize"),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const where: any = {};
  if (q.serviceCodes) where.serviceCode = { in: q.serviceCodes };
  if (q.dateFrom)     where.departure   = { gte: new Date(q.dateFrom) };
  if (q.dateTo)       where.arrival     = { lte: new Date(q.dateTo) };

  const skip = (q.page - 1) * q.pageSize;
  const take = q.pageSize;

  const [ total, items ] = await Promise.all([
    prismaClient.voyage.count({ where }),
    prismaClient.voyage.findMany({
      where,
      skip,
      take,
      orderBy: { departure: "asc" },
      include: {
        portCalls: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            portCode: true,
            eta: true,
            etd: true,
            vesselName: true,
            mode: true,
            order: true,
          }
        }
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);
  return NextResponse.json({ meta: { total, page: q.page, pageSize: take, totalPages }, items }, { status: 200 });
}
