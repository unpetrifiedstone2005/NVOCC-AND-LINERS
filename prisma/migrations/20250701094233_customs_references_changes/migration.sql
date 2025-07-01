/*
  Warnings:

  - Added the required column `updatedAt` to the `CustomsReference` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `CustomsReference` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CustomsReferenceType" AS ENUM ('INVOICE', 'PACKING_LIST');

-- AlterTable
ALTER TABLE "CustomsReference" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "CustomsReferenceType" NOT NULL;
