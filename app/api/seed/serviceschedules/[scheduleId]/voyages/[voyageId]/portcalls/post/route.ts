import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

// 1️⃣ Update schema: portUnlocode instead of portCode
const CreatePortCallSchema = z
  .object({
    portUnlocode: z.string().nonempty(),
    order:        z.number().int(),
    eta:          z.string().datetime(),
    etd:          z.string().datetime(),
  })
  .superRefine((data, ctx) => {
    if (data.eta && data.etd) {
      const etaDate = new Date(data.eta);
      const etdDate = new Date(data.etd);
      if (etdDate <= etaDate) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ["etd"],
          message: "ETD must be after ETA",
        });
      }
    }
  });

export async function POST(
  req: NextRequest,
  { params }: { params: { voyageId: string } }
) {
  const { voyageId } = await params;

  // 1️⃣ Validate voyageId format
  if (!/^[0-9a-fA-F\-]{36}$/.test(voyageId)) {
    return NextResponse.json({ error: "Invalid voyageId" }, { status: 400 });
  }

  // 2️⃣ Parse & validate body
  let input;
  try {
    input = CreatePortCallSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // 3️⃣ Fetch the voyage
  const voyage = await prismaClient.voyage.findUnique({
    where: { id: voyageId }
  });
  if (!voyage) {
    return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
  }

  // 4️⃣ Ensure the location exists
  const location = await prismaClient.location.findUnique({
    where: { unlocode: input.portUnlocode }
  });
  if (!location) {
    return NextResponse.json(
      { error: `Location ${input.portUnlocode} is not supported` },
      { status: 404 }
    );
  }

  // 5️⃣ Enforce port-call within voyage window
  const etaDate = new Date(input.eta);
  const etdDate = new Date(input.etd);
  if (etaDate < voyage.departure || etdDate > voyage.arrival) {
    return NextResponse.json(
      {
        error: `Port-call times must be between voyage departure (${voyage.departure.toISOString()}) and arrival (${voyage.arrival.toISOString()})`
      },
      { status: 422 }
    );
  }

  // 6️⃣ All good—create the port call using the new FK
  const portCall = await prismaClient.portCall.create({
    data: {
      voyageId,
      portUnlocode: input.portUnlocode,
      order:        input.order,
      eta:          etaDate,
      etd:          etdDate,
    }
  });

  return NextResponse.json(portCall, { status: 201 });
}
