// File: app/api/tariffs/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

/// 1. Query params schema, renamed & updated to match your new fields
const QuerySchema = z.object({
  commodity:    z.string().optional(),
  serviceCodes: z.preprocess(
                   (val) => typeof val === "string" ? [val] : val,
                   z.array(z.string()).optional()
                 ),
  groups:       z.preprocess(
                   (val) => typeof val === "string" ? [val] : val,
                   z.array(z.enum([
                     "DRY_STANDARD",
                     "HC_STANDARD",
                     "REEFER",
                     "OPEN_TOP"
                   ])).optional()
                 ),
  pol:          z.string().optional(),
  pod:          z.string().optional(),
  minRate:      z.preprocess(Number, z.number().min(0)).optional(),
  maxRate:      z.preprocess(Number, z.number().min(0)).optional(),
  page:         z.preprocess(Number, z.number().int().min(1)).default(1),
  pageSize:     z.preprocess(Number, z.number().int().min(1).max(100)).default(20),
});

export async function GET(request: Request) {
  // 2. Parse & validate query
  let q;
  try {
    const url = new URL(request.url);
    q = QuerySchema.parse({
      commodity:    url.searchParams.get("commodity") ?? undefined,
      serviceCodes: url.searchParams.getAll("serviceCodes"),
      groups:       url.searchParams.getAll("groups"),
      pol:          url.searchParams.get("pol") ?? undefined,
      pod:          url.searchParams.get("pod") ?? undefined,
      minRate:      url.searchParams.get("minRate"),
      maxRate:      url.searchParams.get("maxRate"),
      page:         url.searchParams.get("page"),
      pageSize:     url.searchParams.get("pageSize"),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  // 3. Build Prisma `where` filter
  const where: any = {};
  if (q.commodity)    where.commodity  = q.commodity;
  if (q.serviceCodes) where.serviceCode = { in: q.serviceCodes };
  if (q.groups)       where.group       = { in: q.groups };
  if (q.pol)          where.pol         = q.pol;
  if (q.pod)          where.pod         = q.pod;
  if (q.minRate !== undefined || q.maxRate !== undefined) {
    where.ratePerTeu = {};
    if (q.minRate !== undefined) where.ratePerTeu.gte = q.minRate;
    if (q.maxRate !== undefined) where.ratePerTeu.lte = q.maxRate;
  }

  // 4. Pagination
  const skip  = (q.page - 1) * q.pageSize;
  const take  = q.pageSize;

  // 5. Fetch total count + page of items
  const [ total, items ] = await Promise.all([
    prismaClient.tariff.count({ where }),
    prismaClient.tariff.findMany({
      where,
      skip,
      take,
      orderBy: { ratePerTeu: "desc" },
      select: {
        serviceCode: true,
        pol:         true,
        pod:         true,
        commodity:   true,
        group:       true,
        ratePerTeu:  true,
        validFrom:   true,
        validTo:     true,
      }
    })
  ]);

  // 6. Return paginated response
  const totalPages = Math.ceil(total / take);
  return NextResponse.json({
    meta: { total, page: q.page, pageSize: take, totalPages },
    items
  }, { status: 200 });
}
