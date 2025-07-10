-- CreateTable
CREATE TABLE "IGM" (
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

    CONSTRAINT "IGM_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IGM_bookingId_key" ON "IGM"("bookingId");

-- AddForeignKey
ALTER TABLE "IGM" ADD CONSTRAINT "IGM_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
