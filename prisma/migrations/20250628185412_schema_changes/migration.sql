/*
  Warnings:

  - You are about to drop the `Carrier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_carrierId_fkey";

-- DropForeignKey
ALTER TABLE "Vessel" DROP CONSTRAINT "Vessel_carrierId_fkey";

-- DropTable
DROP TABLE "Carrier";

-- DropTable
DROP TABLE "Service";
