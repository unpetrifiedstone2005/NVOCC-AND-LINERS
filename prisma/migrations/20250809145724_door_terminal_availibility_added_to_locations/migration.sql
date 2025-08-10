-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "doorDeliveryAllowed" BOOLEAN,
ADD COLUMN     "doorNotes" TEXT,
ADD COLUMN     "doorPickupAllowed" BOOLEAN;

-- CreateIndex
CREATE INDEX "Location_doorPickupAllowed_doorDeliveryAllowed_idx" ON "Location"("doorPickupAllowed", "doorDeliveryAllowed");
