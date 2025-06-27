-- CreateTable
CREATE TABLE "QuotationContainer" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "weightPerContainer" DECIMAL(10,2) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL,
    "hsCode" TEXT NOT NULL,
    "dangerousGoods" BOOLEAN NOT NULL,
    "imoClass" TEXT,
    "unNumber" TEXT,

    CONSTRAINT "QuotationContainer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuotationContainer" ADD CONSTRAINT "QuotationContainer_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
