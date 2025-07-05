/*
  Warnings:

  - You are about to drop the column `bookingId` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `countryOfDestination` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `countryOfOrigin` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `goodsDescription` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `hsCode` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `imoClass` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `isDangerous` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `packingGroup` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `quotationId` on the `Declaration` table. All the data in the column will be lost.
  - You are about to drop the column `unNumber` on the `Declaration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Declaration" DROP COLUMN "bookingId",
DROP COLUMN "countryOfDestination",
DROP COLUMN "countryOfOrigin",
DROP COLUMN "goodsDescription",
DROP COLUMN "hsCode",
DROP COLUMN "imoClass",
DROP COLUMN "isDangerous",
DROP COLUMN "packingGroup",
DROP COLUMN "quotationId",
DROP COLUMN "unNumber",
ADD COLUMN     "shippingInstructionId" TEXT;

-- CreateTable
CREATE TABLE "DeclarationLine" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "cargoId" TEXT,
    "unNumber" TEXT NOT NULL,
    "properShippingName" TEXT NOT NULL,
    "imoClass" TEXT NOT NULL,
    "packingGroup" TEXT NOT NULL,
    "flashPointC" DECIMAL(6,2),
    "flashPointF" DECIMAL(6,2),
    "packageType" TEXT NOT NULL,
    "numberOfPackages" INTEGER NOT NULL,
    "netWeight" DECIMAL(12,2) NOT NULL,
    "netWeightUnit" TEXT NOT NULL,
    "grossWeight" DECIMAL(12,2),
    "grossWeightUnit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeclarationLine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationLine" ADD CONSTRAINT "DeclarationLine_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationLine" ADD CONSTRAINT "DeclarationLine_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
