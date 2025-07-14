import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { ContainerStatus } from "@prisma/client";

const PatchContainerSchema = z.object({
  bicCode:              z.string().optional(),
  containerTypeIsoCode: z.string().optional(),
  ownership:            z.string().optional(),
  companyOrigin:        z.string().optional(),
  manufacturer:         z.string().optional(),
  customsApproval:      z.string().optional(),
  description:          z.string().optional(),
  status:               z.nativeEnum(ContainerStatus).optional(),
  currentDepot:         z.string().optional(),
  lastUsedAt:           z.string().datetime().optional(),
  cscPlateUrl:          z.string().url().optional(),
  certificationExpiry:  z.string().datetime().optional(),
  foodGrade:            z.boolean().optional(),
})
.refine(obj => Object.keys(obj).length > 0, {
  message: "At least one field must be provided",
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { containerNo: string } }
) {
  try {
    const json = await request.json();
    const data = PatchContainerSchema.parse(json);

    // Narrow date props
    const { lastUsedAt, certificationExpiry, ...rest } = data;

    const updatePayload: Record<string, any> = { ...rest };
    if (lastUsedAt)           updatePayload.lastUsedAt = new Date(lastUsedAt);
    if (certificationExpiry)  updatePayload.certificationExpiry = new Date(certificationExpiry);

    const updated = await prismaClient.container.update({
      where: { containerNo: params.containerNo },
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
