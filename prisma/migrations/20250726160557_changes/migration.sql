/*
  Warnings:

  - Made the column `voyageNumber` on table `Voyage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `arrival` on table `Voyage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Voyage" ALTER COLUMN "voyageNumber" SET NOT NULL,
ALTER COLUMN "arrival" SET NOT NULL;
