-- CreateTable
CREATE TABLE "EGM" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "portOfLoading" TEXT NOT NULL,
    "portOfDischarge" TEXT NOT NULL,
    "manifestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EGM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EGMContainer" (
    "id" TEXT NOT NULL,
    "egmId" TEXT NOT NULL,
    "containerNo" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "grossWeight" DECIMAL(12,2) NOT NULL,
    "netWeight" DECIMAL(12,2),
    "noOfPackages" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EGMContainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EGM_bookingId_key" ON "EGM"("bookingId");

-- AddForeignKey
ALTER TABLE "EGM" ADD CONSTRAINT "EGM_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EGMContainer" ADD CONSTRAINT "EGMContainer_egmId_fkey" FOREIGN KEY ("egmId") REFERENCES "EGM"("id") ON DELETE CASCADE ON UPDATE CASCADE;
