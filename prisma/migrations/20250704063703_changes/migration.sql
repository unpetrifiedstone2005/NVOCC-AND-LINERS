/*
  Warnings:

  - You are about to drop the column `category` on the `ContainerType` table. All the data in the column will be lost.
  - You are about to drop the column `containerCategory` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the `QuotationService` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `QuotationContainer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuotationService" DROP CONSTRAINT "QuotationService_quotationContainerId_fkey";

-- DropForeignKey
ALTER TABLE "QuotationService" DROP CONSTRAINT "QuotationService_serviceId_fkey";

-- AlterTable
ALTER TABLE "ContainerType" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "containerCategory";

-- AlterTable
ALTER TABLE "QuotationContainer" ADD COLUMN     "type" TEXT NOT NULL;

-- DropTable
DROP TABLE "QuotationService";

-- DropEnum
DROP TYPE "ContainerCategory";

-- CreateTable
CREATE TABLE "QuotationContainerService" (
    "id" TEXT NOT NULL,
    "quotationContainerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuotationContainerService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuotationContainerService_quotationContainerId_serviceId_key" ON "QuotationContainerService"("quotationContainerId", "serviceId");

-- AddForeignKey
ALTER TABLE "QuotationContainerService" ADD CONSTRAINT "QuotationContainerService_quotationContainerId_fkey" FOREIGN KEY ("quotationContainerId") REFERENCES "QuotationContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationContainerService" ADD CONSTRAINT "QuotationContainerService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
