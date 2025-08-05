// app/api/seed/surcharges/post/route.ts
import { NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { prismaClient } from "@/app/lib/db"

// your single‐definition schema
const SurchargeDefSchema = z.object({
  name:          z.string(),
  scope:         z.enum(["ORIGIN","FREIGHT","DESTINATION"]),
  portCode:      z.string().optional(),
  serviceCode:   z.string().optional(),
  isPercentage:  z.boolean().default(false),
  currency:      z.string().default("USD"),
  effectiveFrom: z.string().datetime(),
  effectiveTo:   z.string().datetime().optional(),
  defaultRate:   z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  rates:         z.array(z.object({
                   containerTypeIsoCode: z.string(),
                   amount:               z.string().regex(/^\d+(\.\d{1,2})?$/)
                 })).optional(),
})

// allow either one or many
const BulkOrSingle = z.union([
  SurchargeDefSchema,
  z.array(SurchargeDefSchema),
])

export async function POST(req: Request) {
  let payload: z.infer<typeof BulkOrSingle>
  try {
    payload = await req.json()
    payload = BulkOrSingle.parse(payload)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // normalize to array
  const defs = Array.isArray(payload) ? payload : [payload]
  const results: Array<{ id?: string; errors?: any }> = []

  for (const defData of defs) {
    try {
      // build your data object just like before
      const data: any = {
        name:          defData.name,
        scope:         defData.scope,
        portCode:      defData.portCode,
        serviceCode:   defData.serviceCode,
        isPercentage:  defData.isPercentage,
        currency:      defData.currency,
        effectiveFrom: new Date(defData.effectiveFrom),
        effectiveTo:   defData.effectiveTo ? new Date(defData.effectiveTo) : undefined,
      }

      if (defData.isPercentage) {
        // use your new defaultRate column
        data.defaultRate = parseFloat(defData.defaultRate!)
      } else if (defData.rates) {
        data.rates = {
          create: defData.rates.map(r => ({
            containerTypeIsoCode: r.containerTypeIsoCode,
            amount:               parseFloat(r.amount),
          }))
        }
      }

      const created = await prismaClient.surchargeDef.create({
        data,
        include: { rates: true }
      })

      results.push({ id: created.id })
    } catch (e: any) {
      // collect and continue on errors
      if (e instanceof ZodError) {
        results.push({ errors: e.errors })
      } else {
        results.push({ errors: e.message })
      }
    }
  }

  // if it was a single‐object call, unwrap the array
  if (!Array.isArray(payload)) {
    const res = results[0]
    return res.id
      ? NextResponse.json({ id: res.id }, { status: 201 })
      : NextResponse.json({ error: res.errors }, { status: 400 })
  }

  // for bulk, return multi‐status
  return NextResponse.json({ results }, { status: 207 })
}
