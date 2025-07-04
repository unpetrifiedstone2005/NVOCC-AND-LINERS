/*
  Warnings:

  - You are about to drop the column `destinationDepot` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `exportMoT` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `importMoT` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `originDepot` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupType` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `routingSelected` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleOption` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleWeeks` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `bicCode` on the `Container` table. All the data in the column will be lost.
  - You are about to drop the column `reefer` on the `Container` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Container` table. All the data in the column will be lost.
  - You are about to drop the column `containerType` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `destinationPortId` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `originPortId` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the `ContainerTypeSpec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuotationContainer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SOCContainer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryOption` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endLocation` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupOption` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLocation` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `containerTypeId` to the `Container` table without a default value. This is not possible if the table is not empty.
  - Added the required column `containerCategory` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `containerTypeId` to the `RateSheet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endLocation` to the `RateSheet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLocation` to the `RateSheet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContainerCategory" AS ENUM ('GENERAL_PURPOSE', 'OPERATING_REEFER');

-- DropForeignKey
ALTER TABLE "QuotationContainer" DROP CONSTRAINT "QuotationContainer_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_destinationPortId_fkey";

-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_originPortId_fkey";

-- DropForeignKey
ALTER TABLE "SOCContainer" DROP CONSTRAINT "SOCContainer_quotationContainerId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "destinationDepot",
DROP COLUMN "exportMoT",
DROP COLUMN "importMoT",
DROP COLUMN "originDepot",
DROP COLUMN "pickupType",
DROP COLUMN "routingSelected",
DROP COLUMN "scheduleDate",
DROP COLUMN "scheduleOption",
DROP COLUMN "scheduleWeeks",
ADD COLUMN     "arrivalDate" TIMESTAMP(3),
ADD COLUMN     "deliveryOption" "DeliveryType" NOT NULL,
ADD COLUMN     "departureDate" TIMESTAMP(3),
ADD COLUMN     "endLocation" TEXT NOT NULL,
ADD COLUMN     "exportMOT" TEXT,
ADD COLUMN     "importMOT" TEXT,
ADD COLUMN     "pickupOption" "DeliveryType" NOT NULL,
ADD COLUMN     "selectedRoutingId" TEXT,
ADD COLUMN     "startLocation" TEXT NOT NULL,
ADD COLUMN     "transitWeeks" INTEGER;

-- AlterTable
ALTER TABLE "Container" DROP COLUMN "bicCode",
DROP COLUMN "reefer",
DROP COLUMN "type",
ADD COLUMN     "containerTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "containerCategory" "ContainerCategory" NOT NULL;

-- AlterTable
ALTER TABLE "RateSheet" DROP COLUMN "containerType",
DROP COLUMN "destinationPortId",
DROP COLUMN "originPortId",
ADD COLUMN     "containerTypeId" TEXT NOT NULL,
ADD COLUMN     "endIsPort" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "endLocation" TEXT NOT NULL,
ADD COLUMN     "startIsPort" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startLocation" TEXT NOT NULL;

-- DropTable
DROP TABLE "ContainerTypeSpec";

-- DropTable
DROP TABLE "QuotationContainer";

-- DropTable
DROP TABLE "SOCContainer";

-- CreateTable
CREATE TABLE "ServiceSchedule" (
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Voyage" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "departure" TIMESTAMP(3) NOT NULL,
    "arrival" TIMESTAMP(3),

    CONSTRAINT "Voyage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortCall" (
    "id" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "portCode" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "eta" TIMESTAMP(3),
    "etd" TIMESTAMP(3),

    CONSTRAINT "PortCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "containerTypes" TEXT[],
    "ratePerCtr" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRouting" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "pol" TEXT NOT NULL,
    "pod" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "importHaulage" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "ctrTypes" TEXT[],
    "ratePerCtr" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuotationRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bicCode" TEXT,
    "category" "ContainerCategory" NOT NULL,
    "lengthMm" INTEGER NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "maxStackWeightKg" INTEGER NOT NULL,
    "tareWeightKg" INTEGER NOT NULL,
    "maxGrossWeightKg" INTEGER NOT NULL,

    CONSTRAINT "ContainerType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Voyage_serviceCode_idx" ON "Voyage"("serviceCode");

-- CreateIndex
CREATE INDEX "PortCall_portCode_idx" ON "PortCall"("portCode");

-- CreateIndex
CREATE INDEX "PortCall_voyageId_order_idx" ON "PortCall"("voyageId", "order");

-- CreateIndex
CREATE INDEX "Tariff_serviceCode_commodity_idx" ON "Tariff"("serviceCode", "commodity");

-- CreateIndex
CREATE INDEX "QuotationRouting_quotationId_idx" ON "QuotationRouting"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "ContainerType_name_key" ON "ContainerType"("name");

-- AddForeignKey
ALTER TABLE "Voyage" ADD CONSTRAINT "Voyage_serviceCode_fkey" FOREIGN KEY ("serviceCode") REFERENCES "ServiceSchedule"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortCall" ADD CONSTRAINT "PortCall_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_serviceCode_fkey" FOREIGN KEY ("serviceCode") REFERENCES "ServiceSchedule"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRouting" ADD CONSTRAINT "QuotationRouting_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_containerTypeId_fkey" FOREIGN KEY ("containerTypeId") REFERENCES "ContainerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_containerTypeId_fkey" FOREIGN KEY ("containerTypeId") REFERENCES "ContainerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
