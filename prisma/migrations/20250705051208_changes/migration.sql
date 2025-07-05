/*
  Warnings:

  - You are about to alter the column `weightPerContainer` on the `QuotationContainer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `ctrTypes` on the `QuotationRouting` table. All the data in the column will be lost.
  - You are about to drop the column `ratePerCtr` on the `QuotationRouting` table. All the data in the column will be lost.
  - Added the required column `currencySnapshot` to the `QuotationContainerService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratePerUnitSnapshot` to the `QuotationContainerService` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `importHaulage` on the `QuotationRouting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "QuotationContainer" ALTER COLUMN "weightPerContainer" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "QuotationContainerService" ADD COLUMN     "currencySnapshot" TEXT NOT NULL,
ADD COLUMN     "ratePerUnitSnapshot" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "QuotationRouting" DROP COLUMN "ctrTypes",
DROP COLUMN "ratePerCtr",
DROP COLUMN "importHaulage",
ADD COLUMN     "importHaulage" "DeliveryType" NOT NULL;

-- CreateIndex
CREATE INDEX "PortCall_etd_idx" ON "PortCall"("etd");

-- CreateIndex
CREATE INDEX "PortCall_eta_idx" ON "PortCall"("eta");

-- CreateIndex
CREATE INDEX "Voyage_departure_idx" ON "Voyage"("departure");

-- CreateIndex
CREATE INDEX "Voyage_arrival_idx" ON "Voyage"("arrival");

-- AddForeignKey
ALTER TABLE "QuotationRouting" ADD CONSTRAINT "QuotationRouting_serviceCode_fkey" FOREIGN KEY ("serviceCode") REFERENCES "ServiceSchedule"("code") ON DELETE CASCADE ON UPDATE CASCADE;
