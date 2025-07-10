/*
  Warnings:

  - Added the required column `ratePerDay` to the `ContainerReleaseOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContainerReleaseOrder" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "ratePerDay" DECIMAL(12,2) NOT NULL;
