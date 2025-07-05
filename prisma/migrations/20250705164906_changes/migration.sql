/*
  Warnings:

  - You are about to drop the `BookingCargoSnapshot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BookingCargoSnapshot" DROP CONSTRAINT "BookingCargoSnapshot_bookingContainerId_fkey";

-- DropTable
DROP TABLE "BookingCargoSnapshot";

-- CreateTable
CREATE TABLE "BookingCargo" (
    "id" TEXT NOT NULL,
    "bookingContainerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "cargoWeight" DECIMAL(12,2) NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "dgDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SIVersion" (
    "id" TEXT NOT NULL,
    "shippingInstructionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "data" JSONB NOT NULL,
    "note" TEXT,

    CONSTRAINT "SIVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BookingCargo" ADD CONSTRAINT "BookingCargo_bookingContainerId_fkey" FOREIGN KEY ("bookingContainerId") REFERENCES "BookingContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIVersion" ADD CONSTRAINT "SIVersion_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIVersion" ADD CONSTRAINT "SIVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
