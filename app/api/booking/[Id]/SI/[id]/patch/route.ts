// File: app/api/bookings/[bookingId]/si/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { DeclarationStatus, DeclarationType } from "@prisma/client";

// --- Zod schemas for allowed SI fields to patch ---

// Cargo update schema
const PatchCargoSchema = z.object({
  id:            z.string().uuid(),       // existing SiCargo.id
  hsCode:        z.string().min(1).optional(),
  description:   z.string().min(1).optional(),
  noOfPackages:  z.number().int().nonnegative().optional(),
  grossWeight:   z.number().nonnegative().optional(),
  netWeight:     z.number().nonnegative().optional(),
  isDangerous:   z.boolean().optional(),
  unNumber:      z.string().optional().nullable(),
  imoClass:      z.string().optional().nullable(),
  packingGroup:  z.string().optional().nullable(),
});

// Container update schema
const PatchContainerSchema = z.object({
  id:               z.string().uuid(),         // existing ShippingInstructionContainer.id
  containerNumber:  z.string().optional(),
  seals:            z.array(z.string()).optional(),
  marksAndNumbers:  z.string().optional(),
  cargo:            z.array(PatchCargoSchema).optional(),
});

// Top-level PATCH payload
const PatchSISchema = z.object({
  consignee:       z.string().min(1).optional(),
  notifyParty:     z.string().optional(),
  specialRemarks:  z.string().optional(),
  containers:      z.array(PatchContainerSchema).optional(),
});
type PatchSIInput = z.infer<typeof PatchSISchema>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate bookingId
  if (!/^[0-9a-fA-F\-]{36}$/.test(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  // 2) Parse & validate body
  let updates: PatchSIInput;
  try {
    updates = PatchSISchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // 3) Load booking with qty & types
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: {
      containers: { select: { type: true, qty: true } }
    }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const maxAllowed = booking.containers.reduce((sum, bc) => sum + bc.qty, 0);
  const allowedTypes = new Set(booking.containers.map(bc => bc.type));

  // 4) Load CRO-released container numbers & types
  const croRows = await prismaClient.cROContainer.findMany({
    where: { cro: { bookingId } },
    select: {
      container: {
        select: {
          containerNo:          true,
          containerTypeIsoCode: true
        }
      }
    }
  });
  const allowedNumbers = new Set(croRows.map(r => r.container.containerNo));
  const typeByNumber = new Map<string,string>(
    croRows.map(r => [r.container.containerNo, r.container.containerTypeIsoCode])
  );

  // 5) Validate container changes if provided
  if (updates.containers) {
    // enforce total count <= CRO count
    if (updates.containers.length > croRows.length) {
      return NextResponse.json(
        { error: `You can only include up to ${croRows.length} containers.` },
        { status: 400 }
      );
    }
    for (const c of updates.containers) {
      // if they provided a new containerNumber, it must be one of the CRO ones
      if (c.containerNumber !== undefined) {
        if (!allowedNumbers.has(c.containerNumber)) {
          return NextResponse.json(
            { error: `Container ${c.containerNumber} was not released in CRO.` },
            { status: 400 }
          );
        }
        // and its type must match one of the booked types
        const typ = typeByNumber.get(c.containerNumber)!;
        if (!allowedTypes.has(typ)) {
          return NextResponse.json(
            { error: `Container ${c.containerNumber} has type ${typ}, which was not in the original booking.` },
            { status: 400 }
          );
        }
      }
    }
  }

  // 6) Load existing SI
  const existingSI = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    include: { containers: { include: { cargoes: true } } }
  });
  if (!existingSI) {
    return NextResponse.json({ error: "SI not found" }, { status: 404 });
  }

  // 7) Apply updates in a transaction
  const updatedSI = await prismaClient.$transaction(async tx => {
    // A) Header updates
    const data: Record<string, any> = {};
    if (updates.consignee      !== undefined) data.consignee      = updates.consignee;
    if (updates.notifyParty    !== undefined) data.notifyParty    = updates.notifyParty;
    if (updates.specialRemarks !== undefined) data.specialRemarks = updates.specialRemarks;

    await tx.shippingInstruction.update({
      where: { id: existingSI.id },
      data
    });

    // B) Container-level updates
    if (updates.containers) {
      for (const c of updates.containers) {
        // Update container metadata
        const contData: Record<string, any> = {};
        if (c.containerNumber     !== undefined) contData.containerNumber    = c.containerNumber;
        if (c.seals               !== undefined) contData.seals               = c.seals;
        if (c.marksAndNumbers     !== undefined) contData.marksAndNumbers     = c.marksAndNumbers;

        await tx.shippingInstructionContainer.update({
          where: { id: c.id },
          data: contData
        });

        // Update cargo lines under this container
        if (c.cargo) {
          for (const line of c.cargo) {
            const cargoData: Record<string, any> = {};
            if (line.hsCode       !== undefined) cargoData.hsCode       = line.hsCode;
            if (line.description  !== undefined) cargoData.description  = line.description;
            if (line.noOfPackages !== undefined) cargoData.noOfPackages = line.noOfPackages;
            if (line.grossWeight  !== undefined) cargoData.grossWeight  = line.grossWeight;
            if (line.netWeight    !== undefined) cargoData.netWeight    = line.netWeight;
            if (line.isDangerous  !== undefined) cargoData.isDangerous  = line.isDangerous;
            if (line.unNumber     !== undefined) cargoData.unNumber     = line.unNumber;
            if (line.imoClass     !== undefined) cargoData.imoClass     = line.imoClass;
            if (line.packingGroup !== undefined) cargoData.packingGroup = line.packingGroup;

            await tx.siCargo.update({
              where: { id: line.id },
              data: cargoData
            });
          }
        }
      }
    }

    // C) Return full SI with updated children
    return tx.shippingInstruction.findUniqueOrThrow({
      where: { id: existingSI.id },
      include: { containers: { include: { cargoes: true } } }
    });
  });

  // 8) Determine declaration requirements
  const hasDG = updatedSI.containers.some(c =>
    c.cargoes.some(l => l.isDangerous)
  );
  const dgDone = Boolean(
    await prismaClient.declaration.findFirst({
      where: {
        shippingInstructionId: updatedSI.id,
        declarationType:       DeclarationType.DG,
        status:                DeclarationStatus.SUBMITTED
      },
      select: { id: true }
    })
  );
  const customsDone = Boolean(
    await prismaClient.declaration.findFirst({
      where: {
        shippingInstructionId: updatedSI.id,
        declarationType:       DeclarationType.CUSTOMS,
        status:                DeclarationStatus.SUBMITTED
      },
      select: { id: true }
    })
  );

  // 9) Return
  return NextResponse.json({
    shippingInstruction:        updatedSI,
    requiresCustomsDeclaration: !customsDone,
    requiresDGDeclaration:      hasDG && !dgDone
  }, { status: 200 });
}
