// File: app/api/surcharges/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// query params schema
const QuerySchema = z.object({
  scope:       z.enum(["ORIGIN","FREIGHT","DESTINATION"]).optional(),
  portCode:    z.string().optional(),
  serviceCode: z.string().optional(),
  page:        z.preprocess(Number, z.number().int().min(1)).default(1),
  limit:       z.preprocess(Number, z.number().int().min(1).max(100)).default(20),
  sortBy:      z.enum(["name","effectiveFrom","effectiveTo"]).default("effectiveFrom"),
  sortOrder:   z.enum(["asc","desc"]).default("desc"),
});

export async function GET(req: Request) {
  let q;
  try {
    const url = new URL(req.url);
    q = QuerySchema.parse({
      scope:       url.searchParams.get("scope")      ?? undefined,
      portCode:    url.searchParams.get("portCode")   ?? undefined,
      serviceCode: url.searchParams.get("serviceCode")?? undefined,
      page:        url.searchParams.get("page"),
      limit:       url.searchParams.get("limit"),
      sortBy:      url.searchParams.get("sortBy")     as any,
      sortOrder:   url.searchParams.get("sortOrder")  as any,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const where: any = {};
  if (q.scope)       where.scope       = q.scope;
  if (q.portCode)    where.portCode    = q.portCode;
  if (q.serviceCode) where.serviceCode = q.serviceCode;

  const skip = (q.page - 1) * q.limit;
  const take = q.limit;

  const [ total, items ] = await Promise.all([
    prismaClient.surchargeDef.count({ where }),
    prismaClient.surchargeDef.findMany({
      where,
      skip,
      take,
      orderBy: { [q.sortBy]: q.sortOrder },
      include: {
        rates: { orderBy: { containerTypeIsoCode: "asc" } }
      }
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
