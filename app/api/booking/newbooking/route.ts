// File: app/api/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }               from "zod";
import { PrismaClient }              from "@prisma/client";

const prisma = new PrismaClient();

// --- Zod schemas ---

const CargoSchema = z.object({
  hsCode:       z.string().min(1),
  description:  z.string().min(1),
  grossWeight:  z.number().nonnegative().optional().default(0),
  netWeight:    z.number().nonnegative().optional().default(0),
  isDangerous:  z.boolean().optional().default(false),
  unNumber:     z.string().optional().nullable(),
  imoClass:     z.string().optional().nullable(),
  packingGroup: z.string().optional().nullable(),
});

const ContainerSchema = z.object({
  type:         z.string().min(1),
  qty:          z.number().int().min(1),
  shipperOwned: z.boolean().optional().default(false),
  releaseDate:  z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date"),
  cargo:        z.array(CargoSchema).min(1),
});

const CustomsRefSchema = z.object({
  type:      z.enum(["INVOICE","PACKING_LIST"]),
  reference: z.string().min(1),
});

const BookingSchema = z.object({
  quotationId:       z.string().uuid(),
  selectedRoutingId: z.string().uuid(),
  customerName:      z.string().optional(),
  contactReference:  z.string().optional(),
  contactName:       z.string().min(1),
  contactPhone:      z.string().optional(),
  contactEmail:      z.string().email(),
  startLocation:     z.string().min(1),
  departureDate:     z.string().refine(d => !isNaN(Date.parse(d))),
  pickupOption:      z.enum(["door","terminal"]),
  via1:              z.string().optional(),
  via2:              z.string().optional(),
  endLocation:       z.string().min(1),
  arrivalDate:       z.string().refine(d => !isNaN(Date.parse(d))),
  deliveryOption:    z.enum(["door","terminal"]),
  exportMOT:         z.string().optional(),
  importMOT:         z.string().optional(),
  optimizeReefer:    z.boolean().optional().default(false),
  containers:        z.array(ContainerSchema).min(1),
  customsReferences: z.array(CustomsRefSchema).max(5).optional(),
  bolCount:          z.number().int().min(0).optional(),
  exportFiling:      z.boolean().optional().default(false),
  filingBy:          z.string().optional(),
  remarks:           z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Parse & validate payload
  let data: z.infer<typeof BookingSchema>;
  try {
    data = BookingSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ errors: e.flatten().fieldErrors }, { status: 422 });
    }
    throw e;
  }

  // 2. Lookup the quotation to get the user
  const quote = await prisma.quotation.findUniqueOrThrow({
    where: { id: data.quotationId },
    select: { userId: true },
  });

  // 3. Create booking + containers + BookingCargo + customsReferences
  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        user:              { connect: { id: quote.userId } },
        quotation:         { connect: { id: data.quotationId } },
        selectedRoutingId: data.selectedRoutingId,
        customerName:      data.customerName,
        contactReference:  data.contactReference,
        contactName:       data.contactName,
        contactPhone:      data.contactPhone,
        contactEmail:      data.contactEmail,
        startLocation:     data.startLocation,
        departureDate:     new Date(data.departureDate),
        pickupOption:      data.pickupOption,
        via1:              data.via1,
        via2:              data.via2,
        endLocation:       data.endLocation,
        arrivalDate:       new Date(data.arrivalDate),
        deliveryOption:    data.deliveryOption,
        exportMOT:         data.exportMOT,
        importMOT:         data.importMOT,
        optimizeReefer:    data.optimizeReefer,
        bolCount:          data.bolCount,
        exportFiling:      data.exportFiling,
        filingBy:          data.filingBy,
        remarks:           data.remarks,
        containers: {
          create: data.containers.map(c => ({
            type:         c.type,
            qty:          c.qty,
            shipperOwned: c.shipperOwned,
            releaseDate:  new Date(c.releaseDate),
            cargo: {
              create: c.cargo.map(cg => ({
                description:  cg.description,
                hsCode:       cg.hsCode,
                cargoWeight:  cg.grossWeight ?? 0,
                weightUnit:   "kg",
                dgDetails:    cg.isDangerous
                                 ? `${cg.unNumber ?? ""}|${cg.imoClass ?? ""}|${cg.packingGroup ?? ""}`
                                 : null,
              }))
            }
          }))
        },
        customsReferences: data.customsReferences?.length
          ? { create: data.customsReferences.map(r => ({
              type:      r.type,
              reference: r.reference,
            })) }
          : undefined,
      },
      include: {
        containers:        { include: { cargo: true } },
        customsReferences: true,
      },
    });
  } catch (err) {
    console.error("Booking creation error:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // 4. Auto-generate CRO (omitted for brevity; unchanged)
   let cro;
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/bookings/${booking.id}/CRO`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        releasedToType: "TRUCKER",
        releasedToId:   "drayage-provider-uuid",
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ booking, error: err.error }, { status: res.status });
    }
    cro = (await res.json()).cro;
  } catch (err) {
    console.error("CRO creation error:", err);
    return NextResponse.json({ booking, error: "Failed to allocate containers" }, { status: 500 });
  }
  // 5. Return booking (+ cro)
  return NextResponse.json({ booking /*, cro */ }, { status: 201 });
}
