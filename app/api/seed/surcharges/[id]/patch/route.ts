import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// 1) Define which fields you’ll accept
const UpdateSurchargeSchema = z.object({
  name:          z.string().optional(),
  scope:         z.enum(["ORIGIN","FREIGHT","DESTINATION"]).optional(),
  portCode:      z.string().optional(),
  serviceCode:   z.string().optional(),
  isPercentage:  z.boolean().optional(),
  currency:      z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo:   z.string().datetime().optional().nullable(),
  defaultRate:   z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  let body: z.infer<typeof UpdateSurchargeSchema>;
  try {
    body = UpdateSurchargeSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Build the Prisma update payload
  const data: any = {};
  if (body.name !== undefined)          data.name          = body.name;
  if (body.scope !== undefined)         data.scope         = body.scope;
  if (body.portCode !== undefined)      data.portCode      = body.portCode;
  if (body.serviceCode !== undefined)   data.serviceCode   = body.serviceCode;
  if (body.isPercentage !== undefined)  data.isPercentage  = body.isPercentage;
  if (body.currency !== undefined)      data.currency      = body.currency;
  if (body.effectiveFrom)               data.effectiveFrom = new Date(body.effectiveFrom);
  if (body.effectiveTo !== undefined)   data.effectiveTo   = body.effectiveTo ? new Date(body.effectiveTo) : null;
  if (body.defaultRate !== undefined)   data.defaultRate   = parseFloat(body.defaultRate);

  try {
    const updated = await prismaClient.surchargeDef.update({
      where: { id },
      data,
      include: { rates: true }
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    // Unique constraint, FK, or other errors
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
