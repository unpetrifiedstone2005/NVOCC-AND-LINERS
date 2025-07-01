-- CreateTable
CREATE TABLE "Refunded" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "supplementaryInvoiceId" TEXT,
    "draftVersionId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "Refunded_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Refunded" ADD CONSTRAINT "Refunded_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refunded" ADD CONSTRAINT "Refunded_supplementaryInvoiceId_fkey" FOREIGN KEY ("supplementaryInvoiceId") REFERENCES "SupplementaryInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refunded" ADD CONSTRAINT "Refunded_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "BLDraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
