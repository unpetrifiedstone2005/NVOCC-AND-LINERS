/*
  Warnings:

  - You are about to drop the column `socDetails` on the `Quotation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "socDetails";

-- CreateTable
CREATE TABLE "SOCContainer" (
    "id" TEXT NOT NULL,
    "quotationContainerId" TEXT NOT NULL,
    "containerNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tareWeight" DECIMAL(10,2) NOT NULL,
    "cscPlateUrl" TEXT NOT NULL,
    "cscExpiry" TIMESTAMP(3) NOT NULL,
    "manufactureDate" TIMESTAMP(3),
    "acepApprovalNo" TEXT,
    "allowableStackWeight" DECIMAL(10,2),
    "rackingTestLoadValue" DECIMAL(10,2),
    "surveyReportUrl" TEXT,
    "ownershipProofUrl" TEXT,
    "declarationUrl" TEXT NOT NULL,
    "photos" TEXT[],
    "isReefer" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceManualUrl" TEXT,
    "emergencyProceduresUrl" TEXT,
    "sparePartsKit" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOCContainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SOCContainer_containerNo_key" ON "SOCContainer"("containerNo");

-- AddForeignKey
ALTER TABLE "SOCContainer" ADD CONSTRAINT "SOCContainer_quotationContainerId_fkey" FOREIGN KEY ("quotationContainerId") REFERENCES "QuotationContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
