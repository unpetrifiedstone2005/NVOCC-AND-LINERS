import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";

enum ContainerStatus {
  AVAILABLE = "AVAILABLE",
  ALLOCATED = "ALLOCATED",
  // ...other statuses
}

type BLDraftSnapshot = {
  bookingId: string;
  originPort: string;
  portOfLoading: string;
  containers: Array<{
    id: string;
    type: string;
    cargoes: Array<{
      id: string;
      grossWeight: number;
      description: string;
      hsCode: string;
      grossVolume?: number | null;
      noOfPackages?: number | null;
      netWeight?: number | null;
      netVolume?: number | null;
    }>;
  }>;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { documentNo: string; id: string } }
) {
    const bLDraftId = params.documentNo;
    const versionId = params.id;

  try {
    // 1. Fetch B/L draft versions
    const versions = await prismaClient.bLDraftVersion.findMany({
      where: { draftNo: bLDraftId },
      orderBy: { createdAt: "asc" }
    });
    console.log('Found versions:', versions.map(v => ({ id: v.id, draftNo: v.draftNo, snapshot: !!v.snapshot })));
    const latest = versions.find(v => v.id === versionId);
    if (!latest || !latest.snapshot) {
      return NextResponse.json({ error: "B/L draft version or snapshot not found" }, { status: 404 });
    }
    const latestSnapshot = latest.snapshot as BLDraftSnapshot;

    // 2. Validate and get booking
    if (!latestSnapshot.bookingId) {
      return NextResponse.json({ error: "bookingId missing in snapshot" }, { status: 400 });
    }
    const bookingId = latestSnapshot.bookingId;
    const booking = await prismaClient.booking.findUnique({
      where: { id: bookingId },
      include: { containers: true, quotation: true }
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 3. Update allowed booking fields from snapshot
    const updatableFields = {
      originDepot: "originPort",
      routingSelected: "portOfLoading",
    };
    const updateData: Record<string, any> = {};
    for (const [bookingField, draftField] of Object.entries(updatableFields)) {
      if (draftField in latestSnapshot) {
        updateData[bookingField] = latestSnapshot[draftField as keyof BLDraftSnapshot];
      }
    }
    await prismaClient.booking.update({
      where: { id: bookingId },
      data: updateData
    });

    // === Cargo splitting logic for overweight containers, with real container allocation ===
    let draftContainers = await prismaClient.bLDraftContainer.findMany({
      where: { bLDraftId },
      include: { cargoes: true },
    });

    const containerTypes = Array.from(
      new Set(draftContainers.map(c => c.sizeType).filter((t): t is string => !!t))
    );
    const containerTypeSpecs = await prismaClient.containerTypeSpec.findMany({
      where: { type: { in: containerTypes } }
    });

    const getMaxWeight = (sizeType: string) =>
      Number(containerTypeSpecs.find(s => s.type === sizeType)?.maxStackWeightKg || 0);

    let newContainersAdded = 0;

    for (const container of draftContainers) {
      if (!container.sizeType) continue;
      const maxWeight = getMaxWeight(container.sizeType);
      let runningWeight = 0;
      let overflowCargoes: Array<{
        description: string;
        hsCode: string;
        grossWeight: number;
        grossVolume?: number | null;
        noOfPackages?: number | null;
        netWeight?: number | null;
        netVolume?: number | null;
      }> = [];

      const cargoes = [...container.cargoes];

      for (const cargo of cargoes) {
        const cw = cargo.grossWeight || 0;
        if (runningWeight + cw <= maxWeight) {
          runningWeight += cw;
        } else {
          const spaceLeft = maxWeight - runningWeight;
          if (spaceLeft > 0) {
            await prismaClient.bLDraftCargo.update({
              where: { id: cargo.id },
              data: { grossWeight: spaceLeft }
            });
            overflowCargoes.push({
              description: cargo.description,
              hsCode: cargo.hsCode,
              grossWeight: cw - spaceLeft,
              grossVolume: cargo.grossVolume,
              noOfPackages: cargo.noOfPackages,
              netWeight: cargo.netWeight,
              netVolume: cargo.netVolume,
            });
          } else {
            overflowCargoes.push({
              description: cargo.description,
              hsCode: cargo.hsCode,
              grossWeight: cw,
              grossVolume: cargo.grossVolume,
              noOfPackages: cargo.noOfPackages,
              netWeight: cargo.netWeight,
              netVolume: cargo.netVolume,
            });
          }
          break;
        }
      }

      // Recursively assign overflow cargoes to new containers (with allocation logic)
      let remainingCargoes = overflowCargoes;
      while (remainingCargoes.length > 0) {
        // 1. Find and allocate a real container
        const availableContainer = await prismaClient.container.findFirst({
          where: {
            type: container.sizeType,
            status: ContainerStatus.AVAILABLE,
          },
          orderBy: { lastUsedAt: "asc" },
        });
        if (!availableContainer) {
          return NextResponse.json(
            { error: `No available containers of type ${container.sizeType}` },
            { status: 400 }
          );
        }

        // 2. Mark as allocated
        await prismaClient.container.update({
          where: { id: availableContainer.id },
          data: { status: ContainerStatus.ALLOCATED, lastUsedAt: new Date() },
        });

        // 3. Create allocation record
        await prismaClient.allocation.create({
          data: {
            bookingId: booking.id,
            containerId: availableContainer.id,
          }
        });

        // 4. Create BLDraftContainer using the real container's number
        const newContainer = await prismaClient.bLDraftContainer.create({
          data: {
            bLDraftId,
            sizeType: container.sizeType,
            containerNumber: availableContainer.containerNo,
            // Copy other fields if needed
          }
        });
        newContainersAdded++;

        let newRunningWeight = 0;
        let nextOverflow: typeof remainingCargoes = [];
        for (const cargoData of remainingCargoes) {
          const cw = cargoData.grossWeight || 0;
          if (newRunningWeight + cw <= maxWeight) {
            await prismaClient.bLDraftCargo.create({
              data: {
                ...cargoData,
                containerId: newContainer.id,
              }
            });
            newRunningWeight += cw;
          } else {
            const spaceLeft = maxWeight - newRunningWeight;
            if (spaceLeft > 0) {
              await prismaClient.bLDraftCargo.create({
                data: {
                  ...cargoData,
                  grossWeight: spaceLeft,
                  containerId: newContainer.id,
                }
              });
              const overflowWeight = cw - spaceLeft;
              nextOverflow.push({
                ...cargoData,
                grossWeight: overflowWeight,
              });
            } else {
              nextOverflow.push(cargoData);
            }
            break;
          }
        }
        remainingCargoes = nextOverflow;
      }
    }

    // 6. Re-fetch containers and cargoes after splits/additions
    draftContainers = await prismaClient.bLDraftContainer.findMany({
      where: { bLDraftId },
      include: { cargoes: true },
    });

    // 7. Calculate total gross weight (across all cargoes)
    let totalGrossWeight = 0;
    for (const container of draftContainers) {
      for (const cargo of container.cargoes) {
        totalGrossWeight += cargo.grossWeight || 0;
      }
    }

    // 8. Use the type of the first container in the booking
    const containerType = booking.containers[0]?.type;
    if (!containerType) {
      return NextResponse.json({ error: "No container type found on booking" }, { status: 400 });
    }

    // 9. Get the container type spec for capacity
    const typeSpec = await prismaClient.containerTypeSpec.findUnique({
      where: { type: containerType }
    });
    if (!typeSpec) {
      return NextResponse.json({ error: "Container type spec not found" }, { status: 400 });
    }

    // 10. Calculate allowed weight
    const allowedGrossWeight = booking.containers.reduce(
      (sum, c) => sum + (typeSpec.maxStackWeightKg * c.qty), 0
    );

    // 11. If weight exceeded, add more containers of the SAME type (booking side)
    if (totalGrossWeight > allowedGrossWeight) {
      const deficit = totalGrossWeight - allowedGrossWeight;
      const containersNeeded = Math.ceil(deficit / typeSpec.maxStackWeightKg);

      await prismaClient.bookingContainer.create({
        data: {
          bookingId,
          type: containerType,
          qty: containersNeeded,
          weight: typeSpec.maxStackWeightKg,
          weightUnit: "kg",
          shipperOwned: booking.containers[0].shipperOwned,
          cargoDescription: booking.containers[0].cargoDescription,
          dangerousGoods: booking.containers[0].dangerousGoods,
          imoClass: booking.containers[0].imoClass,
          unNumber: booking.containers[0].unNumber
        }
      });

      newContainersAdded += containersNeeded;
    }

    // 12. Calculate new invoice amount using ratesheet logic
    const updatedBooking = await prismaClient.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { containers: true, quotation: true }
    });

    let total = new Prisma.Decimal(0);
    for (const spec of updatedBooking.containers) {
      const rateDate = updatedBooking.scheduleDate ||
        updatedBooking.quotation?.validFrom ||
        new Date();
      const sheet = await prismaClient.rateSheet.findFirst({
        where: {
          originPortId: updatedBooking.originDepot,
          destinationPortId: updatedBooking.destinationDepot,
          containerType: spec.type,
          validFrom: { lte: rateDate },
          validTo: { gte: rateDate },
        },
        include: { surcharges: true, weightBrackets: true },
      });

      
      if (!sheet) continue;
      const weightKg = Number(spec.weight) || 0;

      // Base rate calculation
      let base = new Prisma.Decimal(sheet.baseRate);
      const bracket = sheet.weightBrackets.find(
        wb => weightKg >= wb.minWeightKg && weightKg <= wb.maxWeightKg
      );
      if (bracket?.ratePerKg) {
        base = new Prisma.Decimal(bracket.ratePerKg).mul(weightKg);
      }

      // Overweight calculation
      let overweightCharge = new Prisma.Decimal(0);
      if (sheet.includedWeightKg && sheet.overweightRatePerKg && weightKg > sheet.includedWeightKg) {
        const overweight = weightKg - sheet.includedWeightKg;
        overweightCharge = new Prisma.Decimal(sheet.overweightRatePerKg).mul(overweight);
      }

      // Surcharges
      const extra = sheet.surcharges.reduce(
        (sum, s) => sum.add(s.amount),
        new Prisma.Decimal(0)
      );

      // Container total
      total = total.add(base.add(overweightCharge).add(extra).mul(spec.qty));
    }

    const newInvoiceAmount = total;

    // 13. Calculate delta against previous invoices
    const invoices = await prismaClient.invoice.findMany({ where: { bookingId } });
    const totalPreviouslyInvoiced = invoices.reduce(
      (sum, inv) => sum.plus(new Decimal(inv.amount)), new Decimal(0)
    );
    const delta = newInvoiceAmount.minus(totalPreviouslyInvoiced);

    // 14. Get active bank account
    const activeBankAccount = await prismaClient.bankAccount.findFirst({
      where: { isActive: true },
    });
    if (!activeBankAccount) {
      return NextResponse.json(
        { error: "No active bank account found for invoice creation" },
        { status: 500 }
      );
    }

    // 15. Create invoice or refund
    let financialRecord = null;
    if (delta.gt(0)) {
      financialRecord = await prismaClient.invoice.create({
        data: {
          userId: booking.userId,
          bookingId,
          bankAccountId: activeBankAccount.id,
          amount: delta.toFixed(2),
          issuedDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "PENDING",
          description: "Delta invoice for B/L draft approval",
        }
      });
    } else if (delta.lt(0)) {
      financialRecord = await prismaClient.refunded.create({
        data: {
          bookingId,
          draftVersionId: latest.id,
          amount: delta.abs().toFixed(2),
          reason: "Refund due to B/L draft approval price decrease",
          status: "PENDING"
        }
      });
    }

    // 16. Update B/L draft version snapshot with updated containers and cargoes
    const updatedSnapshot = {
      ...latestSnapshot,
      containers: draftContainers.map(c => ({
        id: c.id,
        type: c.sizeType,
        containerNumber: c.containerNumber,
        cargoes: (c.cargoes || []).map(cargo => ({
          id: cargo.id,
          grossWeight: cargo.grossWeight,
          description: cargo.description,
          hsCode: cargo.hsCode,
          grossVolume: cargo.grossVolume,
          noOfPackages: cargo.noOfPackages,
          netWeight: cargo.netWeight,
          netVolume: cargo.netVolume,
        })),
      })),
    };

    await prismaClient.bLDraftVersion.update({
      where: { id: latest.id },
      data: {
        snapshot: updatedSnapshot,
      },
    });

    return NextResponse.json({
      message: "B/L draft approved and processed",
      financialRecord,
      newContainersAdded,
      weightDetails: {
        totalGrossWeight,
        allowedGrossWeight,
        weightExceeded: totalGrossWeight > allowedGrossWeight
      },
      invoiceDetails: {
        newInvoiceAmount: newInvoiceAmount.toFixed(2),
        totalPreviouslyInvoiced: totalPreviouslyInvoiced.toFixed(2),
        delta: delta.toFixed(2)
      }
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
