-- CreateEnum
CREATE TYPE "CutoffKind" AS ENUM ('DOC_SI', 'FCL_GATEIN', 'VGM', 'ERD');

-- CreateEnum
CREATE TYPE "CutoffRelativeTo" AS ENUM ('ETD', 'ETA');

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "PortCallCutoff" (
    "id" TEXT NOT NULL,
    "portCallId" TEXT NOT NULL,
    "facilityScheme" "FacilityScheme",
    "facilityCode" TEXT,
    "kind" "CutoffKind" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,

    CONSTRAINT "PortCallCutoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CutoffRule" (
    "id" TEXT NOT NULL,
    "portUnlocode" TEXT NOT NULL,
    "facilityScheme" "FacilityScheme",
    "facilityCode" TEXT,
    "kind" "CutoffKind" NOT NULL,
    "relativeTo" "CutoffRelativeTo" NOT NULL DEFAULT 'ETD',
    "offsetHours" INTEGER NOT NULL,
    "appliesToGroup" "ContainerGroup",
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTo" TIMESTAMP(3),

    CONSTRAINT "CutoffRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortCallCutoff_portCallId_idx" ON "PortCallCutoff"("portCallId");

-- CreateIndex
CREATE UNIQUE INDEX "PortCallCutoff_portCallId_facilityScheme_facilityCode_kind_key" ON "PortCallCutoff"("portCallId", "facilityScheme", "facilityCode", "kind");

-- CreateIndex
CREATE INDEX "CutoffRule_portUnlocode_facilityScheme_facilityCode_kind_idx" ON "CutoffRule"("portUnlocode", "facilityScheme", "facilityCode", "kind");

-- AddForeignKey
ALTER TABLE "PortCallCutoff" ADD CONSTRAINT "PortCallCutoff_portCallId_fkey" FOREIGN KEY ("portCallId") REFERENCES "PortCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
