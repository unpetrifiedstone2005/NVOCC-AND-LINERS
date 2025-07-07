/*
  Warnings:

  - You are about to alter the column `currency` on the `Declaration` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(3)`.
  - The `status` column on the `Declaration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `grossWeightUnit` column on the `DeclarationLine` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[shippingInstructionId]` on the table `Declaration` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `declarationType` on the `Declaration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `shippingInstructionId` on table `Declaration` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `netWeightUnit` on the `DeclarationLine` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DeclarationType" AS ENUM ('CUSTOMS', 'DG');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Declaration" ALTER COLUMN "dutiesAmount" DROP NOT NULL,
ALTER COLUMN "currency" DROP NOT NULL,
ALTER COLUMN "currency" SET DATA TYPE CHAR(3),
DROP COLUMN "declarationType",
ADD COLUMN     "declarationType" "DeclarationType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "DeclarationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "value" DROP NOT NULL,
ALTER COLUMN "shippingInstructionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DeclarationLine" DROP COLUMN "netWeightUnit",
ADD COLUMN     "netWeightUnit" "WeightUnit" NOT NULL,
DROP COLUMN "grossWeightUnit",
ADD COLUMN     "grossWeightUnit" "WeightUnit";

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_shippingInstructionId_key" ON "Declaration"("shippingInstructionId");
