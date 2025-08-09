/*
  Warnings:

  - The values [door,terminal] on the enum `DeliveryType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ICD,CFS,WAREHOUSE] on the enum `LocationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [DOCUMENTAION] on the enum `SurchargeScope` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[facilityScheme,facilityCode]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voyageId,order]` on the table `PortCall` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FacilityScheme" AS ENUM ('SMDG', 'BIC', 'INTERNAL');

-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryType_new" AS ENUM ('DOOR', 'TERMINAL');
ALTER TABLE "Quotation" ALTER COLUMN "pickupType" TYPE "DeliveryType_new" USING ("pickupType"::text::"DeliveryType_new");
ALTER TABLE "Quotation" ALTER COLUMN "deliveryType" TYPE "DeliveryType_new" USING ("deliveryType"::text::"DeliveryType_new");
ALTER TABLE "QuotationRouting" ALTER COLUMN "importHaulage" TYPE "DeliveryType_new" USING ("importHaulage"::text::"DeliveryType_new");
ALTER TABLE "Booking" ALTER COLUMN "pickupOption" TYPE "DeliveryType_new" USING ("pickupOption"::text::"DeliveryType_new");
ALTER TABLE "Booking" ALTER COLUMN "deliveryOption" TYPE "DeliveryType_new" USING ("deliveryOption"::text::"DeliveryType_new");
ALTER TABLE "BLDraft" ALTER COLUMN "pickupType" TYPE "DeliveryType_new" USING ("pickupType"::text::"DeliveryType_new");
ALTER TABLE "BLDraft" ALTER COLUMN "deliveryType" TYPE "DeliveryType_new" USING ("deliveryType"::text::"DeliveryType_new");
ALTER TYPE "DeliveryType" RENAME TO "DeliveryType_old";
ALTER TYPE "DeliveryType_new" RENAME TO "DeliveryType";
DROP TYPE "DeliveryType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LocationType_new" AS ENUM ('SEAPORT', 'INLAND_CITY', 'TERMINAL', 'DEPOT');
ALTER TABLE "Location" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Location" ALTER COLUMN "type" TYPE "LocationType_new" USING ("type"::text::"LocationType_new");
ALTER TYPE "LocationType" RENAME TO "LocationType_old";
ALTER TYPE "LocationType_new" RENAME TO "LocationType";
DROP TYPE "LocationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SurchargeScope_new" AS ENUM ('FREIGHT', 'ORIGIN', 'DESTINATION', 'DOCUMENTATION');
ALTER TABLE "SurchargeDef" ALTER COLUMN "scope" TYPE "SurchargeScope_new" USING ("scope"::text::"SurchargeScope_new");
ALTER TYPE "SurchargeScope" RENAME TO "SurchargeScope_old";
ALTER TYPE "SurchargeScope_new" RENAME TO "SurchargeScope";
DROP TYPE "SurchargeScope_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PortCall" DROP CONSTRAINT "PortCall_portUnlocode_fkey";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "aliases" TEXT[],
ADD COLUMN     "facilityCode" TEXT,
ADD COLUMN     "facilityScheme" "FacilityScheme",
ADD COLUMN     "parentUnlocode" TEXT,
ADD COLUMN     "supported" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validTo" TIMESTAMP(3),
ALTER COLUMN "type" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_parentUnlocode_idx" ON "Location"("parentUnlocode");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_city_idx" ON "Location"("city");

-- CreateIndex
CREATE INDEX "Location_country_idx" ON "Location"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Location_facilityScheme_facilityCode_key" ON "Location"("facilityScheme", "facilityCode");

-- CreateIndex
CREATE UNIQUE INDEX "PortCall_voyageId_order_key" ON "PortCall"("voyageId", "order");

-- AddForeignKey
ALTER TABLE "PortCall" ADD CONSTRAINT "PortCall_portUnlocode_fkey" FOREIGN KEY ("portUnlocode") REFERENCES "Location"("unlocode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentUnlocode_fkey" FOREIGN KEY ("parentUnlocode") REFERENCES "Location"("unlocode") ON DELETE SET NULL ON UPDATE CASCADE;
