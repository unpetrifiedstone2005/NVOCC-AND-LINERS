/*
  Warnings:

  - You are about to drop the `PortCall` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PortCallCutoff` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_containerId_fkey";

-- DropForeignKey
ALTER TABLE "BLDraftCargo" DROP CONSTRAINT "BLDraftCargo_containerId_fkey";

-- DropForeignKey
ALTER TABLE "PortCall" DROP CONSTRAINT "PortCall_portUnlocode_fkey";

-- DropForeignKey
ALTER TABLE "PortCall" DROP CONSTRAINT "PortCall_voyageId_fkey";

-- DropForeignKey
ALTER TABLE "PortCallCutoff" DROP CONSTRAINT "PortCallCutoff_portCallId_fkey";

-- DropForeignKey
ALTER TABLE "container_event" DROP CONSTRAINT "container_event_containerId_fkey";

-- AlterTable
ALTER TABLE "Voyage" ADD COLUMN     "dischargePortUnlocode" TEXT,
ADD COLUMN     "etaUtc" TIMESTAMP(3),
ADD COLUMN     "etdUtc" TIMESTAMP(3),
ADD COLUMN     "loadPortUnlocode" TEXT;

-- DropTable
DROP TABLE "PortCall";

-- DropTable
DROP TABLE "PortCallCutoff";

-- CreateTable
CREATE TABLE "VoyageCutoff" (
    "id" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "facilityScheme" "FacilityScheme",
    "facilityCode" TEXT,
    "kind" "CutoffKind" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,

    CONSTRAINT "VoyageCutoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoyageCutoff_voyageId_idx" ON "VoyageCutoff"("voyageId");

-- CreateIndex
CREATE UNIQUE INDEX "VoyageCutoff_voyageId_facilityScheme_facilityCode_kind_key" ON "VoyageCutoff"("voyageId", "facilityScheme", "facilityCode", "kind");

-- CreateIndex
CREATE INDEX "QuotationRouting_voyageId_idx" ON "QuotationRouting"("voyageId");

-- CreateIndex
CREATE INDEX "Voyage_loadPortUnlocode_idx" ON "Voyage"("loadPortUnlocode");

-- CreateIndex
CREATE INDEX "Voyage_dischargePortUnlocode_idx" ON "Voyage"("dischargePortUnlocode");

-- AddForeignKey
ALTER TABLE "Voyage" ADD CONSTRAINT "Voyage_loadPortUnlocode_fkey" FOREIGN KEY ("loadPortUnlocode") REFERENCES "Location"("unlocode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voyage" ADD CONSTRAINT "Voyage_dischargePortUnlocode_fkey" FOREIGN KEY ("dischargePortUnlocode") REFERENCES "Location"("unlocode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoyageCutoff" ADD CONSTRAINT "VoyageCutoff_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_event" ADD CONSTRAINT "container_event_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftCargo" ADD CONSTRAINT "BLDraftCargo_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "BLDraftContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
