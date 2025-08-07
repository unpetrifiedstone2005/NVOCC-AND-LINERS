/*
  Warnings:

  - You are about to drop the column `pod` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `pol` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `Tariff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[voyageId,commodity,group,validFrom]` on the table `Tariff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `voyageId` to the `Tariff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_serviceId_fkey";

-- DropIndex
DROP INDEX "Tariff_serviceId_pol_pod_commodity_group_validFrom_key";

-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "pod",
DROP COLUMN "pol",
DROP COLUMN "serviceId",
ADD COLUMN     "voyageId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_voyageId_commodity_group_validFrom_key" ON "Tariff"("voyageId", "commodity", "group", "validFrom");

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
