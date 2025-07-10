/*
  Warnings:

  - You are about to drop the `Refunded` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookingId,leg]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leg` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Leg" AS ENUM ('EXPORT', 'IMPORT');

-- DropForeignKey
ALTER TABLE "Refunded" DROP CONSTRAINT "Refunded_draftVersionId_fkey";

-- DropIndex
DROP INDEX "Invoice_bookingId_key";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "leg" "Leg" NOT NULL;

-- DropTable
DROP TABLE "Refunded";

-- CreateTable
CREATE TABLE "DemurrageTerm" (
    "id" TEXT NOT NULL,
    "portCode" TEXT,
    "freeDays" INTEGER NOT NULL,
    "ratePerDay" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "DemurrageTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_leg_key" ON "Invoice"("bookingId", "leg");
