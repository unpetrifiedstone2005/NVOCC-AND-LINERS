/*
  Warnings:

  - You are about to drop the column `containerId` on the `Cargo` table. All the data in the column will be lost.
  - You are about to drop the column `quotationId` on the `Cargo` table. All the data in the column will be lost.
  - You are about to drop the column `containerTypeId` on the `Container` table. All the data in the column will be lost.
  - The primary key for the `ContainerType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bicCode` on the `ContainerType` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `ContainerType` table. All the data in the column will be lost.
  - You are about to drop the column `containerTypeId` on the `QuotationContainer` table. All the data in the column will be lost.
  - The primary key for the `Tariff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `containerTypes` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `ratePerCtr` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the `RateSheet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Surcharge` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookingContainerId` to the `Cargo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingId` to the `Cargo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Cargo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `containerTypeIsoCode` to the `Container` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group` to the `ContainerType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isoCode` to the `ContainerType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teuFactor` to the `ContainerType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `containerTypeIsoCode` to the `QuotationContainer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group` to the `Tariff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pod` to the `Tariff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pol` to the `Tariff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratePerTeu` to the `Tariff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `validFrom` to the `Tariff` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContainerGroup" AS ENUM ('DRY_STANDARD', 'DRY_HC', 'REEFER', 'OPEN_TOP');

-- CreateEnum
CREATE TYPE "LegType" AS ENUM ('ORIGIN_HAULAGE', 'OCEAN_LEG', 'DEST_HAULAGE');

-- DropForeignKey
ALTER TABLE "Container" DROP CONSTRAINT "Container_containerTypeId_fkey";

-- DropForeignKey
ALTER TABLE "QuotationContainer" DROP CONSTRAINT "QuotationContainer_containerTypeId_fkey";

-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_containerTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Surcharge" DROP CONSTRAINT "Surcharge_rateSheetId_fkey";

-- DropIndex
DROP INDEX "Tariff_serviceCode_commodity_idx";

-- AlterTable
ALTER TABLE "Cargo" DROP COLUMN "containerId",
DROP COLUMN "quotationId",
ADD COLUMN     "bookingContainerId" TEXT NOT NULL,
ADD COLUMN     "bookingId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "grossWeight" DECIMAL(10,2),
ADD COLUMN     "netWeight" DECIMAL(10,2),
ADD COLUMN     "noOfPackages" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Container" DROP COLUMN "containerTypeId",
ADD COLUMN     "bicCode" TEXT,
ADD COLUMN     "containerTypeIsoCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ContainerType" DROP CONSTRAINT "ContainerType_pkey",
DROP COLUMN "bicCode",
DROP COLUMN "id",
ADD COLUMN     "group" "ContainerGroup" NOT NULL,
ADD COLUMN     "isoCode" TEXT NOT NULL,
ADD COLUMN     "teuFactor" DOUBLE PRECISION NOT NULL,
ADD CONSTRAINT "ContainerType_pkey" PRIMARY KEY ("isoCode");

-- AlterTable
ALTER TABLE "QuotationContainer" DROP COLUMN "containerTypeId",
ADD COLUMN     "containerTypeIsoCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_pkey",
DROP COLUMN "containerTypes",
DROP COLUMN "id",
DROP COLUMN "ratePerCtr",
ADD COLUMN     "group" "ContainerGroup" NOT NULL,
ADD COLUMN     "pod" TEXT NOT NULL,
ADD COLUMN     "pol" TEXT NOT NULL,
ADD COLUMN     "ratePerTeu" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validTo" TIMESTAMP(3),
ADD CONSTRAINT "Tariff_pkey" PRIMARY KEY ("serviceCode", "pol", "pod", "commodity", "group", "validFrom");

-- DropTable
DROP TABLE "RateSheet";

-- DropTable
DROP TABLE "Surcharge";

-- CreateTable
CREATE TABLE "SurchargeDef" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "SurchargeScope" NOT NULL,
    "portCode" TEXT,
    "serviceCode" TEXT,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "SurchargeDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurchargeRate" (
    "id" TEXT NOT NULL,
    "surchargeDefId" TEXT NOT NULL,
    "containerTypeIsoCode" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SurchargeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationSurcharge" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "surchargeDefId" TEXT NOT NULL,
    "containerTypeIsoCode" TEXT NOT NULL,
    "appliedAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "QuotationSurcharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurchargeDef_scope_portCode_idx" ON "SurchargeDef"("scope", "portCode");

-- CreateIndex
CREATE INDEX "SurchargeDef_scope_serviceCode_idx" ON "SurchargeDef"("scope", "serviceCode");

-- CreateIndex
CREATE INDEX "SurchargeRate_surchargeDefId_containerTypeIsoCode_idx" ON "SurchargeRate"("surchargeDefId", "containerTypeIsoCode");

-- CreateIndex
CREATE INDEX "QuotationSurcharge_quotationId_idx" ON "QuotationSurcharge"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationSurcharge_surchargeDefId_idx" ON "QuotationSurcharge"("surchargeDefId");

-- CreateIndex
CREATE INDEX "Cargo_bookingContainerId_idx" ON "Cargo"("bookingContainerId");

-- AddForeignKey
ALTER TABLE "QuotationContainer" ADD CONSTRAINT "QuotationContainer_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_bookingContainerId_fkey" FOREIGN KEY ("bookingContainerId") REFERENCES "BookingContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurchargeRate" ADD CONSTRAINT "SurchargeRate_surchargeDefId_fkey" FOREIGN KEY ("surchargeDefId") REFERENCES "SurchargeDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurchargeRate" ADD CONSTRAINT "SurchargeRate_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSurcharge" ADD CONSTRAINT "QuotationSurcharge_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSurcharge" ADD CONSTRAINT "QuotationSurcharge_surchargeDefId_fkey" FOREIGN KEY ("surchargeDefId") REFERENCES "SurchargeDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSurcharge" ADD CONSTRAINT "QuotationSurcharge_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;
