-- CreateEnum
CREATE TYPE "InlandMode" AS ENUM ('TRUCK', 'RAIL', 'BARGE');

-- CreateEnum
CREATE TYPE "InlandDirection" AS ENUM ('PRE_CARRIAGE', 'ON_CARRIAGE');

-- CreateTable
CREATE TABLE "InlandZone" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postalPrefixes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InlandZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InlandRate" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "portUnlocode" TEXT NOT NULL,
    "direction" "InlandDirection" NOT NULL,
    "mode" "InlandMode" NOT NULL,
    "containerGroup" "ContainerGroup" NOT NULL,
    "containerTypeIsoCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "basis" TEXT NOT NULL,
    "flatAmount" DECIMAL(12,2),
    "perKmAmount" DECIMAL(12,2),
    "minCharge" DECIMAL(12,2),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "maxDistanceKm" INTEGER,
    "maxWeightKg" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InlandRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InlandRateBreak" (
    "id" TEXT NOT NULL,
    "inlandRateId" TEXT NOT NULL,
    "breakType" TEXT NOT NULL,
    "fromValue" INTEGER NOT NULL,
    "toValue" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "InlandRateBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InlandRate_zoneId_idx" ON "InlandRate"("zoneId");

-- CreateIndex
CREATE INDEX "InlandRate_portUnlocode_direction_mode_containerGroup_conta_idx" ON "InlandRate"("portUnlocode", "direction", "mode", "containerGroup", "containerTypeIsoCode");

-- CreateIndex
CREATE UNIQUE INDEX "InlandRate_zoneId_portUnlocode_direction_mode_containerGrou_key" ON "InlandRate"("zoneId", "portUnlocode", "direction", "mode", "containerGroup", "containerTypeIsoCode", "validFrom");

-- AddForeignKey
ALTER TABLE "InlandRate" ADD CONSTRAINT "InlandRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "InlandZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlandRate" ADD CONSTRAINT "InlandRate_portUnlocode_fkey" FOREIGN KEY ("portUnlocode") REFERENCES "Location"("unlocode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlandRate" ADD CONSTRAINT "InlandRate_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlandRateBreak" ADD CONSTRAINT "InlandRateBreak_inlandRateId_fkey" FOREIGN KEY ("inlandRateId") REFERENCES "InlandRate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
