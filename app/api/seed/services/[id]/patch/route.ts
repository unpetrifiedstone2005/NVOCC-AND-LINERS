// File: app/api/services/[id]/route.ts
import { NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { prismaClient } from "@/app/lib/db"

// 🤖 request‐body validation schema (all fields optional)
const ServiceUpdateInput = z.object({
  code:          z.string().min(1).optional(),
  name:          z.string().min(1).optional(),
  description:   z.string().min(1).optional(),
  ratePerUnit:   z
                   .string()
                   .regex(/^\d+(\.\d{1,2})?$/, "must be a decimal with up to 2 decimal places")
                   .optional(),
  currency:      z.string().min(3).max(3).optional(),
  isRecommended: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    // parse & validate body
    const data = ServiceUpdateInput.parse(await req.json())

    // require at least one field
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      )
    }

    // convert ratePerUnit to number if present
    const updateData: any = { ...data }
    if (data.ratePerUnit !== undefined) {
      updateData.ratePerUnit = parseFloat(data.ratePerUnit)
    }

    // perform the update
    const service = await prismaClient.service.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(service, { status: 200 })
  } catch (e: any) {
    // Zod validation errors
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    // Prisma: record not found
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }
    // Prisma: unique constraint on code
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Service code already exists" },
        { status: 409 }
      )
    }
    // fallback
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    )
  }
}
