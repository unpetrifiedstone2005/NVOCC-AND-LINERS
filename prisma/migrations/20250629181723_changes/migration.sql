-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SupplementaryInvoice" (
    "id" TEXT NOT NULL,
    "originalInvoiceId" TEXT NOT NULL,
    "deltaAmount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplementaryInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "supplementaryInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Refund_supplementaryInvoiceId_key" ON "Refund"("supplementaryInvoiceId");

-- AddForeignKey
ALTER TABLE "SupplementaryInvoice" ADD CONSTRAINT "SupplementaryInvoice_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_supplementaryInvoiceId_fkey" FOREIGN KEY ("supplementaryInvoiceId") REFERENCES "SupplementaryInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
