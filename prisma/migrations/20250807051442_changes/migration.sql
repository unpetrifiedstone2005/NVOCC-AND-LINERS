/*
  Warnings:

  - Added the required column `arrival` to the `Tariff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departure` to the `Tariff` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tariff_voyageId_commodity_group_validFrom_key";

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "arrival" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "departure" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Tariff_serviceId_idx" ON "Tariff"("serviceId");

-- CreateIndex
CREATE INDEX "Tariff_voyageId_idx" ON "Tariff"("voyageId");
