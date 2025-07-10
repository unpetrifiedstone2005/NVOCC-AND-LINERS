// File: app/api/bookings/[bookingId]/si/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";
import { DeclarationStatus, DeclarationType, Leg } from "@prisma/client";

// --- Zod schemas for nested containers & cargo ---
const PatchCargoSchema = z.object({
  id:            z.string().uuid(),
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

const PatchContainerSchema = z.object({
  id:               z.string().uuid(),
  containerNumber:  z.string().optional(),
  seals:            z.array(z.string()).optional(),
  marksAndNumbers:  z.string().optional(),
  cargo:            z.array(PatchCargoSchema).optional(),
});

// --- Zod schema for packing‐list updates ---
const PatchPackingListItem = z.object({
  hsCode:          z.string().min(1),
  description:     z.string().min(1),
  quantity:        z.number().int().nonnegative(),
  netWeight:       z.number().nonnegative().optional(),
  grossWeight:     z.number().nonnegative().optional(),
  marksAndNumbers: z.string().optional(),
});
const PatchPackingListSchema = z.object({
  items: z.array(PatchPackingListItem).min(1)
});

// --- Top-level PATCH payload ---
const PatchSISchema = z.object({
  consignee:       z.string().min(1).optional(),
  notifyParty:     z.string().optional(),
  specialRemarks:  z.string().optional(),
  containers:      z.array(PatchContainerSchema).optional(),
  packingLists:    z.array(PatchPackingListSchema).optional()
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

  // 3) Load booking (for cut‐off & types)
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: {
      siCutOffAt:  true,
      userId:      true,
      containers:  { select: { type: true, qty: true } }
    }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const { siCutOffAt, userId, containers: booked } = booking;
  const maxAllowed = booked.reduce((sum, bc) => sum + bc.qty, 0);
  const allowedTypes = new Set(booked.map(bc => bc.type));

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
  const typeByNumber = new Map(croRows.map(r => [r.container.containerNo, r.container.containerTypeIsoCode]));

  // 5) Validate any container updates
  if (updates.containers) {
    if (updates.containers.length > croRows.length) {
      return NextResponse.json(
        { error: `You can only include up to ${croRows.length} containers.` },
        { status: 400 }
      );
    }
    for (const c of updates.containers) {
      if (c.containerNumber !== undefined) {
        if (!allowedNumbers.has(c.containerNumber)) {
          return NextResponse.json(
            { error: `Container ${c.containerNumber} was not released in CRO.` },
            { status: 400 }
          );
        }
        const typ = typeByNumber.get(c.containerNumber)!;
        if (!allowedTypes.has(typ)) {
          return NextResponse.json(
            { error: `Container ${c.containerNumber} type ${typ} not in booking.` },
            { status: 400 }
          );
        }
      }
    }
  }

  // 6) Load existing SI
  const existingSI = await prismaClient.shippingInstruction.findUnique({
    where: { bookingId },
    include: {
      containers:   { include: { cargoes: true } },
      packingLists: { include: { items: true } }
    }
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
        const contData: Record<string, any> = {};
        if (c.containerNumber     !== undefined) contData.containerNumber   = c.containerNumber;
        if (c.seals               !== undefined) contData.seals              = c.seals;
        if (c.marksAndNumbers     !== undefined) contData.marksAndNumbers    = c.marksAndNumbers;
        await tx.shippingInstructionContainer.update({
          where: { id: c.id },
          data: contData
        });
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

    // C) Packing-list updates
    if (updates.packingLists) {
      await tx.packingList.deleteMany({ where: { shippingInstructionId: existingSI.id } });
      for (const pl of updates.packingLists) {
        await tx.packingList.create({
          data: {
            shippingInstructionId: existingSI.id,
            items: {
              create: pl.items.map(item => ({
                hsCode:          item.hsCode,
                description:     item.description,
                quantity:        item.quantity,
                netWeight:       item.netWeight,
                grossWeight:     item.grossWeight,
                marksAndNumbers: item.marksAndNumbers
              }))
            }
          }
        });
      }
    }

    return tx.shippingInstruction.findUniqueOrThrow({
      where: { id: existingSI.id },
      include: {
        containers:   { include: { cargoes: true } },
        packingLists: { include: { items: true } }
      }
    });
  });

  // 8) SI cut-off amendment fee (EXPORT leg)
  const now = new Date();
  if (siCutOffAt && now > siCutOffAt) {
    const feeRate = await prismaClient.surchargeRate.findFirst({
      where: { surchargeDef: { name: "SI Cut-off Amendment Fee" } },
      select: { amount: true, surchargeDefId: true }
    });
    if (feeRate) {
      // find or create EXPORT invoice
      const defaultBank = await prismaClient.bankAccount.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      const exportInv = await prismaClient.invoice.findFirst({
        where: { bookingId, leg: Leg.EXPORT }
      }) ?? await prismaClient.invoice.create({
        data: {
          bookingId,
          userId,
          leg:           Leg.EXPORT,
          totalAmount:   0,
          issuedDate:    new Date(),
          dueDate:       new Date(Date.now() + 30*24*60*60*1000),
          status:        "PENDING",
          description:   "Export invoice",
          bankAccountId: defaultBank?.id!
        }
      });
      // prevent duplicate fee
      const exists = await prismaClient.invoiceLine.findFirst({
        where: { invoiceId: exportInv.id, reference: feeRate.surchargeDefId }
      });
      if (!exists) {
        await prismaClient.invoiceLine.create({
          data: {
            invoiceId:   exportInv.id,
            description: "SI Cut-off Amendment Fee",
            amount:      feeRate.amount,
            reference:   feeRate.surchargeDefId,
            glCode:      "6003-DOC",
            costCenter:  "Documentation"
          }
        });
        const agg = await prismaClient.invoiceLine.aggregate({
          where: { invoiceId: exportInv.id },
          _sum:  { amount: true }
        });
        await prismaClient.invoice.update({
          where: { id: exportInv.id },
          data:  { totalAmount: agg._sum.amount! }
        });
      }
    }
  }

  // 9) Determine declarations
  const hasDG = updatedSI.containers.some(c =>
    c.cargoes.some(l => l.isDangerous)
  );
  const dgDone = Boolean(await prismaClient.declaration.findFirst({
    where: {
      shippingInstructionId: updatedSI.id,
      declarationType:       DeclarationType.DG,
      status:                DeclarationStatus.SUBMITTED
    },
    select: { id: true }
  }));
  const customsDone = Boolean(await prismaClient.declaration.findFirst({
    where: {
      shippingInstructionId: updatedSI.id,
      declarationType:       DeclarationType.CUSTOMS,
      status:                DeclarationStatus.SUBMITTED
    },
    select: { id: true }
  }));

  // 10) Return
  return NextResponse.json({
    shippingInstruction:        updatedSI,
    requiresCustomsDeclaration: !customsDone,
    requiresDGDeclaration:      hasDG && !dgDone
  }, { status: 200 });
}
