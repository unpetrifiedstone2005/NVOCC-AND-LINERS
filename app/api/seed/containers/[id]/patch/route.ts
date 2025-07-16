// app/api/seed/containers/[id]/patch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { ContainerStatus } from "@prisma/client";

const PatchContainerSchema = z
  .object({
    // Now containerNo is a non‐empty string if provided, or null/undefined if you didn't send it
    containerNo:          z.string().nullish(),
    bicCode:              z.string().nullish(),
    containerTypeIsoCode: z.string().nullish(),
    ownership:            z.string().nullish(),
    companyOrigin:        z.string().nullish(),
    manufacturer:         z.string().nullish(),
    customsApproval:      z.string().nullish(),
    description:          z.string().nullish(),
    status:               z.nativeEnum(ContainerStatus).optional(),
    currentDepot:         z.string().nullish(),
    lastUsedAt:           z.string().datetime().nullish(),
    cscPlateUrl:          z.string().url().nullish(),
    certificationExpiry:  z.string().datetime().nullish(),
    foodGrade:            z.boolean().optional(),
  })
  // Make sure you actually want at least one of those keys present
  .refine(
    obj => Object.values(obj).some(v => v != null),
    { message: "At least one field must be provided" }
  );

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1) parse & validate body
    const json = await request.json();
    const data = PatchContainerSchema.parse(json);

    // 2) strip out date strings, convert to Date
    const { lastUsedAt, certificationExpiry, ...rest } = data;
    const updatePayload: Record<string, any> = { ...rest };
    if (lastUsedAt)          updatePayload.lastUsedAt          = new Date(lastUsedAt);
    if (certificationExpiry) updatePayload.certificationExpiry = new Date(certificationExpiry);

    // 3) update by id
    const updated = await prismaClient.container.update({
      where: { id: params.id },
      data:  updatePayload,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
