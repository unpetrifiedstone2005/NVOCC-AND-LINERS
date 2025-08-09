/*
  Warnings:

  - You are about to drop the column `portCode` on the `PortCall` table. All the data in the column will be lost.
  - You are about to drop the `Port` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `portUnlocode` to the `PortCall` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SEAPORT', 'ICD', 'CFS', 'WAREHOUSE');

-- DropForeignKey
ALTER TABLE "VesselSchedule" DROP CONSTRAINT "VesselSchedule_portOfCallId_fkey";

-- DropForeignKey
ALTER TABLE "container_event" DROP CONSTRAINT "container_event_portUnlocode_fkey";

-- DropIndex
DROP INDEX "PortCall_portCode_idx";

-- AlterTable
ALTER TABLE "PortCall" DROP COLUMN "portCode",
ADD COLUMN     "portUnlocode" TEXT NOT NULL;

-- DropTable
DROP TABLE "Port";

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "unlocode" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "type" "LocationType" NOT NULL DEFAULT 'SEAPORT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_unlocode_key" ON "Location"("unlocode");

-- CreateIndex
CREATE INDEX "PortCall_portUnlocode_idx" ON "PortCall"("portUnlocode");

-- AddForeignKey
ALTER TABLE "PortCall" ADD CONSTRAINT "PortCall_portUnlocode_fkey" FOREIGN KEY ("portUnlocode") REFERENCES "Location"("unlocode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_event" ADD CONSTRAINT "container_event_portUnlocode_fkey" FOREIGN KEY ("portUnlocode") REFERENCES "Location"("unlocode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselSchedule" ADD CONSTRAINT "VesselSchedule_portOfCallId_fkey" FOREIGN KEY ("portOfCallId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
