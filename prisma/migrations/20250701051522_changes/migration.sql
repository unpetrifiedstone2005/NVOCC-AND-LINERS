/*
  Warnings:

  - You are about to drop the column `dangerousGoods` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `imoClass` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `unNumber` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `cargoDescription` on the `QuotationContainer` table. All the data in the column will be lost.
  - You are about to drop the column `dangerousGoods` on the `QuotationContainer` table. All the data in the column will be lost.
  - You are about to drop the column `imoClass` on the `QuotationContainer` table. All the data in the column will be lost.
  - You are about to drop the column `packingGroup` on the `QuotationContainer` table. All the data in the column will be lost.
  - You are about to drop the column `unNumber` on the `QuotationContainer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "dangerousGoods",
DROP COLUMN "imoClass",
DROP COLUMN "unNumber";

-- AlterTable
ALTER TABLE "QuotationContainer" DROP COLUMN "cargoDescription",
DROP COLUMN "dangerousGoods",
DROP COLUMN "imoClass",
DROP COLUMN "packingGroup",
DROP COLUMN "unNumber";
