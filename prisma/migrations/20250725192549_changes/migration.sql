/*
  Warnings:

  - Added the required column `serviceCode` to the `Voyage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Voyage" ADD COLUMN     "serviceCode" TEXT NOT NULL;
