// File: app/api/booking/[bookingId]/si/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

// --- Zod schemas for nested containers & cargo ---
const CargoSchema = z.object({
  hsCode:       z.string().min(1),
  description:  z.string().min(1),
  grossWeight:  z.number().nonnegative().optional(),
  netWeight:    z.number().nonnegative().optional(),
  noOfPackages: z.number().int().nonnegative().optional(),
  isDangerous:  z.boolean().optional().default(false),
  unNumber:     z.string().optional().nullable(),
  imoClass:     z.string().optional().nullable(),
  packingGroup: z.string().optional().nullable(),
});

const ContainerSchema = z.object({
  containerNumber:  z.string().optional(),
  seals:            z.array(z.string()).optional().default([]),
  marksAndNumbers:  z.string().optional(),
  hsCode:           z.string().optional(),
  cargo:            z.array(CargoSchema).min(1),
});

// --- Zod schema for full SI payload ---
const CreateSISchema = z.object({
  consignee:        z.string().min(1),
  placeOfReceipt:   z.string().min(1),
  portOfLoading:    z.string().min(1),
  portOfDischarge:  z.string().min(1),
  finalDestination: z.string().min(1),
  vesselName:       z.string().optional(),
  voyageNumber:     z.string().optional(),
  specialRemarks:   z.string().optional(),
  containers:       z.array(ContainerSchema).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId format
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Parse & validate the request body
  let data: z.infer<typeof CreateSISchema>;
  try {
    data = CreateSISchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 3) Load booking to enforce container count
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    include: { containers: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 4) Enforce total container count
  const maxAllowed = booking.containers.reduce((sum, bc) => sum + bc.qty, 0);
  const requested  = data.containers.length;
  if (requested > maxAllowed) {
    return NextResponse.json({
      error: `You tried to add ${requested} containers, but the booking only has ${maxAllowed} booked.`
    }, { status: 400 });
  }

  // 5) Detect DG cargo in the payload
  const requiresDGDeclaration = data.containers
    .some(c => c.cargo.some(line => line.isDangerous));

  // 6) Create the SI with nested containers & cargo
  let si;
  try {
    si = await prismaClient.shippingInstruction.create({
      data: {
        bookingId,
        consignee:        data.consignee,
        placeOfReceipt:   data.placeOfReceipt,
        portOfLoading:    data.portOfLoading,
        portOfDischarge:  data.portOfDischarge,
        finalDestination: data.finalDestination,
        vesselName:       data.vesselName,
        voyageNumber:     data.voyageNumber,
        specialRemarks:   data.specialRemarks,
        containers: {
          create: data.containers.map(c => ({
            containerNumber: c.containerNumber,
            seals:           c.seals,
            marksAndNumbers: c.marksAndNumbers,
            hsCode:          c.hsCode,
            cargo: {
              create: c.cargo.map(line => ({
                hsCode:       line.hsCode,
                description:  line.description,
                grossWeight:  line.grossWeight,
                netWeight:    line.netWeight,
                noOfPackages: line.noOfPackages,
                isDangerous:  line.isDangerous,
                unNumber:     line.unNumber,
                imoClass:     line.imoClass,
                packingGroup: line.packingGroup,
              }))
            }
          }))
        }
      },
      include: {
        containers: { include: { cargoes: true } }
      }
    });
  } catch (err) {
    console.error("Error creating SI:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  // 7) Check for existing CUSTOMS declaration (none on first create)
  const customsDone = !!(
    await prismaClient.declaration.findFirst({
      where: {
        shippingInstructionId: si.id,
        declarationType:       "CUSTOMS",
        status:                "COMPLETED",
      },
      select: { id: true }
    })
  );
  const requiresCustomsDeclaration = !customsDone;

  // 8) Return the SI plus both flags
  return NextResponse.json(
    {
      shippingInstruction:        si,
      requiresCustomsDeclaration, // true until a CUSTOMS decl is completed
      requiresDGDeclaration,      // true if any DG cargo lines
    },
    { status: 201 }
  );
}
