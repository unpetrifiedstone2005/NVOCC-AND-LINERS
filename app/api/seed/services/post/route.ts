// File: app/api/services/route.ts
import { NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { prismaClient } from "@/app/lib/db"

// 🤖 request‐body validation schema
const ServiceInput = z.object({
  code:          z.string().min(1),
  name:          z.string().min(1),
  description:   z.string().min(1),
  ratePerUnit:   z
                   .string()
                   .regex(/^\d+(\.\d{1,2})?$/, "must be a decimal, up to 2 places"),
  currency:      z.string().min(3).max(3),
  isRecommended: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  try {
    // parse & validate
    const body = ServiceInput.parse(await req.json())

    // create in Prisma
    const service = await prismaClient.service.create({
      data: {
        code:          body.code,
        name:          body.name,
        description:   body.description,
        ratePerUnit:   parseFloat(body.ratePerUnit),
        currency:      body.currency,
        isRecommended: body.isRecommended,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (e) {
    if (e instanceof ZodError) {
      // validation
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    // unexpected
    return NextResponse.json(
      { error: (e as Error).message || "Internal error" },
      { status: 500 }
    )
  }
}
