/*
  Warnings:

  - You are about to drop the column `containerQuantity` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `containerType` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `weightPerContainer` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `weightUnit` on the `Quotation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "containerQuantity",
DROP COLUMN "containerType",
DROP COLUMN "weightPerContainer",
DROP COLUMN "weightUnit";
