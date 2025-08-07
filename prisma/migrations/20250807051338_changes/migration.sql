/*
  Warnings:

  - Added the required column `serviceId` to the `Tariff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_voyageId_fkey";

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "serviceId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
