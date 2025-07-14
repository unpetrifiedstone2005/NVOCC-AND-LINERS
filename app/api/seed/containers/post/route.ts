import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";
import { ContainerStatus } from "@prisma/client";

const CreateContainerSchema = z.object({
  containerNo:          z.string().min(1),
  bicCode:              z.string().optional(),
  containerTypeIsoCode: z.string().min(1),
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
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const data = CreateContainerSchema.parse(json);

    // Destructure into locals so TS knows these are string | undefined
    const { lastUsedAt, certificationExpiry } = data;

    const container = await prismaClient.container.create({
      data: {
        containerNo:          data.containerNo,
        bicCode:              data.bicCode ?? null,
        containerTypeIsoCode: data.containerTypeIsoCode,
        ownership:            data.ownership ?? null,
        companyOrigin:        data.companyOrigin ?? null,
        manufacturer:         data.manufacturer ?? null,
        customsApproval:      data.customsApproval ?? null,
        description:          data.description ?? null,
        status:               data.status,
        currentDepot:         data.currentDepot ?? null,
        lastUsedAt:           lastUsedAt ? new Date(lastUsedAt) : null,
        cscPlateUrl:          data.cscPlateUrl ?? null,
        certificationExpiry:  certificationExpiry ? new Date(certificationExpiry) : null,
        foodGrade:            data.foodGrade ?? false,
      },
    });

    return NextResponse.json(container, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
