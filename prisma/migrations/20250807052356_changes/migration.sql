/*
  Warnings:

  - You are about to drop the column `serviceId` on the `Tariff` table. All the data in the column will be lost.
  - Added the required column `scheduleId` to the `Tariff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_serviceId_fkey";

-- DropIndex
DROP INDEX "Tariff_serviceId_idx";

-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "serviceId",
ADD COLUMN     "scheduleId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Tariff_scheduleId_idx" ON "Tariff"("scheduleId");

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ServiceSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
