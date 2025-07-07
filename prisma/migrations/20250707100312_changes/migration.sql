-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "blCutOffAt" TIMESTAMP(3),
ADD COLUMN     "siCutOffAt" TIMESTAMP(3),
ADD COLUMN     "vgmCutOffAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ContainerReleaseOrder" ADD CONSTRAINT "ContainerReleaseOrder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VGMTransmission" ADD CONSTRAINT "VGMTransmission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
