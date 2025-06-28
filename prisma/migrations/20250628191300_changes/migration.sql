/*
  Warnings:

  - Added the required column `operationType` to the `VesselSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VesselSchedule" ADD COLUMN     "operationType" TEXT NOT NULL;
