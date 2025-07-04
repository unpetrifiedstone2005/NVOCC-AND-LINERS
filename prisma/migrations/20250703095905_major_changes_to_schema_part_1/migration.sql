/*
  Warnings:

  - You are about to drop the column `services` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `destinationDepotId` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `includedWeightKg` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `originDepotId` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `overweightRatePerKg` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `supplementaryInvoiceId` on the `Refunded` table. All the data in the column will be lost.
  - You are about to drop the `Depot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplementaryInvoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeightBracket` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `UserId` to the `BLDraft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxGrossWeightKg` to the `ContainerTypeSpec` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Surcharge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scope` to the `Surcharge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SurchargeScope" AS ENUM ('FREIGHT', 'ORIGIN', 'DESTINATION');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OPERATOR';

-- DropForeignKey
ALTER TABLE "BLDraftVersion" DROP CONSTRAINT "BLDraftVersion_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Cargo" DROP CONSTRAINT "Cargo_containerId_fkey";

-- DropForeignKey
ALTER TABLE "Cargo" DROP CONSTRAINT "Cargo_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "Declaration" DROP CONSTRAINT "Declaration_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_destinationDepotId_fkey";

-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_originDepotId_fkey";

-- DropForeignKey
ALTER TABLE "Refunded" DROP CONSTRAINT "Refunded_supplementaryInvoiceId_fkey";

-- DropForeignKey
ALTER TABLE "SupplementaryInvoice" DROP CONSTRAINT "SupplementaryInvoice_originalInvoiceId_fkey";

-- DropForeignKey
ALTER TABLE "WeightBracket" DROP CONSTRAINT "WeightBracket_rateSheetId_fkey";

-- AlterTable
ALTER TABLE "BLDraft" ADD COLUMN     "UserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ContainerTypeSpec" ADD COLUMN     "maxGrossWeightKg" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "croId" TEXT,
ADD COLUMN     "shippingInstructionId" TEXT;

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "services",
ADD COLUMN     "endIsPort" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startIsPort" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RateSheet" DROP COLUMN "destinationDepotId",
DROP COLUMN "includedWeightKg",
DROP COLUMN "originDepotId",
DROP COLUMN "overweightRatePerKg";

-- AlterTable
ALTER TABLE "Refunded" DROP COLUMN "supplementaryInvoiceId";

-- AlterTable
ALTER TABLE "Surcharge" ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "scope" "SurchargeScope" NOT NULL;

-- DropTable
DROP TABLE "Depot";

-- DropTable
DROP TABLE "SupplementaryInvoice";

-- DropTable
DROP TABLE "WeightBracket";

-- CreateTable
CREATE TABLE "DetentionTerm" (
    "id" TEXT NOT NULL,
    "depotId" TEXT,
    "carrierId" TEXT,
    "freeDays" INTEGER NOT NULL,
    "ratePerDay" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "DetentionTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CROContainer" (
    "id" TEXT NOT NULL,
    "croId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "handedOverAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CROContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerReleaseOrder" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "releasedToType" TEXT NOT NULL,
    "releasedToId" TEXT NOT NULL,
    "depotUnlocode" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freeDays" INTEGER NOT NULL,
    "detentionTermId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerReleaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ratePerUnit" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationService" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "ratePerUnit" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInstruction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "consignee" TEXT NOT NULL,
    "notifyParty" TEXT,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "placeOfReceipt" TEXT,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "finalDestination" TEXT,
    "specialRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingList" (
    "id" TEXT NOT NULL,
    "shippingInstructionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingListItem" (
    "id" TEXT NOT NULL,
    "packingListId" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "netWeight" DOUBLE PRECISION,
    "grossWeight" DOUBLE PRECISION,
    "marksAndNumbers" TEXT,

    CONSTRAINT "PackingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContainerReleaseOrder_bookingId_key" ON "ContainerReleaseOrder"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInstruction_bookingId_key" ON "ShippingInstruction"("bookingId");

-- AddForeignKey
ALTER TABLE "CROContainer" ADD CONSTRAINT "CROContainer_croId_fkey" FOREIGN KEY ("croId") REFERENCES "ContainerReleaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CROContainer" ADD CONSTRAINT "CROContainer_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerReleaseOrder" ADD CONSTRAINT "ContainerReleaseOrder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerReleaseOrder" ADD CONSTRAINT "ContainerReleaseOrder_detentionTermId_fkey" FOREIGN KEY ("detentionTermId") REFERENCES "DetentionTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationService" ADD CONSTRAINT "QuotationService_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationService" ADD CONSTRAINT "QuotationService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_croId_fkey" FOREIGN KEY ("croId") REFERENCES "ContainerReleaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInstruction" ADD CONSTRAINT "ShippingInstruction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingList" ADD CONSTRAINT "PackingList_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingListItem" ADD CONSTRAINT "PackingListItem_packingListId_fkey" FOREIGN KEY ("packingListId") REFERENCES "PackingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
