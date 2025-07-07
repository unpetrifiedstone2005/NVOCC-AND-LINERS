/*
  Warnings:

  - You are about to drop the `QuotationSurcharge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuotationSurcharge" DROP CONSTRAINT "QuotationSurcharge_containerTypeIsoCode_fkey";

-- DropForeignKey
ALTER TABLE "QuotationSurcharge" DROP CONSTRAINT "QuotationSurcharge_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "QuotationSurcharge" DROP CONSTRAINT "QuotationSurcharge_surchargeDefId_fkey";

-- DropTable
DROP TABLE "QuotationSurcharge";

-- CreateTable
CREATE TABLE "QuotationLine" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "glCode" TEXT,
    "costCenter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationLine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
