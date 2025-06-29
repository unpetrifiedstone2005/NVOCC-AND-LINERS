/*
  Warnings:

  - You are about to drop the column `grossWeightKg` on the `BLDraftContainer` table. All the data in the column will be lost.
  - You are about to drop the column `kindAndNoOfPackages` on the `BLDraftContainer` table. All the data in the column will be lost.
  - You are about to drop the column `netWeightKg` on the `BLDraftContainer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VolumeUnit" AS ENUM ('m3', 'ft3', 'l');

-- AlterEnum
ALTER TYPE "WeightUnit" ADD VALUE 't';

-- AlterTable
ALTER TABLE "BLDraftContainer" DROP COLUMN "grossWeightKg",
DROP COLUMN "kindAndNoOfPackages",
DROP COLUMN "netWeightKg",
ADD COLUMN     "grossVolume" DOUBLE PRECISION,
ADD COLUMN     "grossVolumeUnit" "VolumeUnit",
ADD COLUMN     "grossWeight" DOUBLE PRECISION,
ADD COLUMN     "grossWeightUnit" "WeightUnit",
ADD COLUMN     "kindOfPackages" TEXT,
ADD COLUMN     "netVolume" DOUBLE PRECISION,
ADD COLUMN     "netVolumeUnit" "VolumeUnit",
ADD COLUMN     "netWeight" DOUBLE PRECISION,
ADD COLUMN     "netWeightUnit" "WeightUnit",
ADD COLUMN     "noOfPackages" INTEGER;
