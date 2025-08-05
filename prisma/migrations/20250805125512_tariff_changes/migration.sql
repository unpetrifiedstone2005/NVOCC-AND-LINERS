/*
  Warnings:

  - The primary key for the `Tariff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ratePerTeu` on the `Tariff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serviceId,pol,pod,commodity,group,validFrom]` on the table `Tariff` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Tariff` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_pkey",
DROP COLUMN "ratePerTeu",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "TariffRate" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "TariffRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TariffRate_tariffId_containerType_key" ON "TariffRate"("tariffId", "containerType");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_serviceId_pol_pod_commodity_group_validFrom_key" ON "Tariff"("serviceId", "pol", "pod", "commodity", "group", "validFrom");

-- AddForeignKey
ALTER TABLE "TariffRate" ADD CONSTRAINT "TariffRate_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
