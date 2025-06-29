/*
  Warnings:

  - Added the required column `countryOfDestination` to the `Declaration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryOfOrigin` to the `Declaration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Declaration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `declarationType` to the `Declaration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goodsDescription` to the `Declaration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Declaration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Declaration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Declaration" ADD COLUMN     "countryOfDestination" TEXT NOT NULL,
ADD COLUMN     "countryOfOrigin" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "declarationType" TEXT NOT NULL,
ADD COLUMN     "dgClass" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "goodsDescription" TEXT NOT NULL,
ADD COLUMN     "isDangerous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packingGroup" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "unNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" DECIMAL(12,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
