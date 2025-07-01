/*
  Warnings:

  - You are about to drop the `Refund` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DraftStatus" ADD VALUE 'EXCEEDS_CAPACITY';
ALTER TYPE "DraftStatus" ADD VALUE 'PRICE_CHANGE_PENDING';

-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_supplementaryInvoiceId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "commodity" TEXT,
ADD COLUMN     "contractNumber" TEXT,
ADD COLUMN     "contractValidTo" TIMESTAMP(3),
ADD COLUMN     "contractualParty" TEXT,
ADD COLUMN     "contractualPartyAddress" TEXT,
ADD COLUMN     "customerAddress" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customsDetails" TEXT,
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "pickupDate" TIMESTAMP(3),
ADD COLUMN     "routingSelected" TEXT,
ADD COLUMN     "scheduleOption" TEXT;

-- DropTable
DROP TABLE "Refund";
