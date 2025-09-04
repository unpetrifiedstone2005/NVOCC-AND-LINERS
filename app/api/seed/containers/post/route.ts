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
    // 1) pull raw JSON
    const raw = await request.json();
    console.log("DEBUG: Raw payload received:", raw);

    // 2) strip out empty strings for optional fields
    const payload: Record<string, any> = { ...raw };
    for (const key of [
      "bicCode",
      "ownership",
      "companyOrigin",
      "manufacturer",
      "customsApproval",
      "description",
      "status",
      "currentDepot",
      "lastUsedAt",
      "cscPlateUrl",
      "certificationExpiry"
    ]) {
      if (payload[key] === "") {
        delete payload[key];
        console.log(`DEBUG: Removed empty optional field "${key}"`);
      }
    }
    console.log("DEBUG: Payload after stripping empty strings:", payload);

    // 3) validate
    let data;
    try {
      data = CreateContainerSchema.parse(payload);
      console.log("DEBUG: Validation successful:", data);
    } catch (zodErr) {
      console.error("DEBUG: Validation failed:", zodErr);
      throw zodErr;
    }

    // 4) destructure date strings
    const { lastUsedAt, certificationExpiry } = data;

    // 5) persist
    let container;
    try {
      container = await prismaClient.container.create({
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
      console.log("DEBUG: Container created successfully:", container);
    } catch (dbErr) {
      console.error("DEBUG: Prisma insert failed:", dbErr);
      throw dbErr;
    }

    return NextResponse.json(container, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    console.error("DEBUG: Internal server error caught:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}