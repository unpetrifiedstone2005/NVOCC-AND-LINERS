/*
  Warnings:

  - You are about to drop the column `imoClass` on the `Container` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Container" DROP COLUMN "imoClass";

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "containerId" TEXT,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "unNumber" TEXT,
    "imoClass" TEXT,
    "packingGroup" TEXT,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "QuotationContainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
