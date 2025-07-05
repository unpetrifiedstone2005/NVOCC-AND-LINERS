/*
  Warnings:

  - You are about to drop the column `bookingContainerId` on the `Cargo` table. All the data in the column will be lost.
  - Added the required column `shippingInstructionContainerId` to the `Cargo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cargo" DROP CONSTRAINT "Cargo_bookingContainerId_fkey";

-- AlterTable
ALTER TABLE "Cargo" DROP COLUMN "bookingContainerId",
ADD COLUMN     "shippingInstructionContainerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BookingCargoSnapshot" (
    "id" TEXT NOT NULL,
    "bookingContainerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "cargoWeight" DECIMAL(12,2) NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "dgDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCargoSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BookingCargoSnapshot" ADD CONSTRAINT "BookingCargoSnapshot_bookingContainerId_fkey" FOREIGN KEY ("bookingContainerId") REFERENCES "BookingContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_shippingInstructionContainerId_fkey" FOREIGN KEY ("shippingInstructionContainerId") REFERENCES "ShippingInstructionContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
