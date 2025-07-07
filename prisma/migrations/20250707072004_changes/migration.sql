/*
  Warnings:

  - You are about to drop the `Cargo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cargo" DROP CONSTRAINT "Cargo_shippingInstructionContainerId_fkey";

-- DropForeignKey
ALTER TABLE "DeclarationLine" DROP CONSTRAINT "DeclarationLine_cargoId_fkey";

-- DropTable
DROP TABLE "Cargo";

-- CreateTable
CREATE TABLE "SiCargo" (
    "id" TEXT NOT NULL,
    "shippingInstructionContainerId" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grossWeight" DECIMAL(10,2),
    "netWeight" DECIMAL(10,2),
    "noOfPackages" INTEGER,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "unNumber" TEXT,
    "imoClass" TEXT,
    "packingGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiCargo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiCargo" ADD CONSTRAINT "SiCargo_shippingInstructionContainerId_fkey" FOREIGN KEY ("shippingInstructionContainerId") REFERENCES "ShippingInstructionContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationLine" ADD CONSTRAINT "DeclarationLine_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "SiCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
