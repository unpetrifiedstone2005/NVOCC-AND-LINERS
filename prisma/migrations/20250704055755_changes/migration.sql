/*
  Warnings:

  - You are about to drop the column `createdAt` on the `QuotationService` table. All the data in the column will be lost.
  - You are about to drop the column `quotationId` on the `QuotationService` table. All the data in the column will be lost.
  - You are about to alter the column `ratePerUnit` on the `QuotationService` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.
  - Added the required column `quotationContainerId` to the `QuotationService` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuotationService" DROP CONSTRAINT "QuotationService_quotationId_fkey";

-- AlterTable
ALTER TABLE "PortCall" ADD COLUMN     "mode" TEXT,
ADD COLUMN     "vesselName" TEXT;

-- AlterTable
ALTER TABLE "QuotationService" DROP COLUMN "createdAt",
DROP COLUMN "quotationId",
ADD COLUMN     "quotationContainerId" TEXT NOT NULL,
ALTER COLUMN "qty" DROP DEFAULT,
ALTER COLUMN "ratePerUnit" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Voyage" ADD COLUMN     "voyageNumber" TEXT;

-- CreateTable
CREATE TABLE "QuotationContainer" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "containerTypeId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "weightPerContainer" DOUBLE PRECISION NOT NULL,
    "weightUnit" TEXT NOT NULL,

    CONSTRAINT "QuotationContainer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuotationContainer" ADD CONSTRAINT "QuotationContainer_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationContainer" ADD CONSTRAINT "QuotationContainer_containerTypeId_fkey" FOREIGN KEY ("containerTypeId") REFERENCES "ContainerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationService" ADD CONSTRAINT "QuotationService_quotationContainerId_fkey" FOREIGN KEY ("quotationContainerId") REFERENCES "QuotationContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRouting" ADD CONSTRAINT "QuotationRouting_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
