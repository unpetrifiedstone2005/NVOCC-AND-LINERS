/*
  Warnings:

  - You are about to drop the column `arrival` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `departure` on the `Tariff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "arrival",
DROP COLUMN "departure";
