-- CreateTable
CREATE TABLE "VGMTransmission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "croContainerId" TEXT NOT NULL,
    "verifiedWeight" DOUBLE PRECISION NOT NULL,
    "providerSignature" TEXT NOT NULL,
    "shipperCompany" TEXT NOT NULL,
    "determinationDate" TIMESTAMP(3),
    "solasMethod" TEXT,
    "solasCertificate" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VGMTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VGMTransmission_bookingId_idx" ON "VGMTransmission"("bookingId");

-- CreateIndex
CREATE INDEX "VGMTransmission_croContainerId_idx" ON "VGMTransmission"("croContainerId");

-- CreateIndex
CREATE UNIQUE INDEX "VGMTransmission_bookingId_croContainerId_key" ON "VGMTransmission"("bookingId", "croContainerId");

-- AddForeignKey
ALTER TABLE "VGMTransmission" ADD CONSTRAINT "VGMTransmission_croContainerId_fkey" FOREIGN KEY ("croContainerId") REFERENCES "CROContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
