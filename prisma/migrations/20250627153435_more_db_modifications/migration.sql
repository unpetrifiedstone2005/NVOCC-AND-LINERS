/*
  Warnings:

  - You are about to drop the column `surchargePct` on the `RateSheet` table. All the data in the column will be lost.
  - You are about to drop the column `containerType` on the `Surcharge` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Surcharge` table. All the data in the column will be lost.
  - Added the required column `rateSheetId` to the `Surcharge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RateSheet" DROP COLUMN "surchargePct",
ADD COLUMN     "carrierId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "includedWeightKg" INTEGER,
ADD COLUMN     "overweightRatePerKg" DECIMAL(12,2),
ADD COLUMN     "serviceId" TEXT;

-- AlterTable
ALTER TABLE "Surcharge" DROP COLUMN "containerType",
DROP COLUMN "date",
ADD COLUMN     "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isPercentage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rateSheetId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "WeightBracket" (
    "id" TEXT NOT NULL,
    "rateSheetId" TEXT NOT NULL,
    "minWeightKg" INTEGER NOT NULL,
    "maxWeightKg" INTEGER NOT NULL,
    "ratePerKg" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "WeightBracket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WeightBracket" ADD CONSTRAINT "WeightBracket_rateSheetId_fkey" FOREIGN KEY ("rateSheetId") REFERENCES "RateSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surcharge" ADD CONSTRAINT "Surcharge_rateSheetId_fkey" FOREIGN KEY ("rateSheetId") REFERENCES "RateSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
