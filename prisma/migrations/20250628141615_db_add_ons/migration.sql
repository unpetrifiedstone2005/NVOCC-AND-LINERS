/*
  Warnings:

  - You are about to drop the column `additionalInformation` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `containerNumbers` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `noOfOriginalBLs` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `placeOfDelivery` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `placeOfReceipt` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `sealNumbers` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `sizeType` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `totalNoOfContainersText` on the `BLDraft` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BLDraft" DROP COLUMN "additionalInformation",
DROP COLUMN "containerNumbers",
DROP COLUMN "noOfOriginalBLs",
DROP COLUMN "placeOfDelivery",
DROP COLUMN "placeOfReceipt",
DROP COLUMN "sealNumbers",
DROP COLUMN "sizeType",
DROP COLUMN "totalNoOfContainersText",
ADD COLUMN     "bolCount" INTEGER,
ADD COLUMN     "deliveryType" "DeliveryType",
ADD COLUMN     "destinationDepot" TEXT,
ADD COLUMN     "originDepot" TEXT,
ADD COLUMN     "pickupType" "DeliveryType",
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "scheduleDate" TIMESTAMP(3),
ADD COLUMN     "scheduleWeeks" INTEGER,
ADD COLUMN     "via1" TEXT,
ADD COLUMN     "via2" TEXT;

-- CreateTable
CREATE TABLE "BLDraftContainer" (
    "id" TEXT NOT NULL,
    "bLDraftId" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "sealNumber" TEXT,
    "sizeType" TEXT,
    "kindAndNoOfPackages" TEXT,
    "descriptionOfGoods" TEXT,
    "grossWeightKg" DOUBLE PRECISION,
    "netWeightKg" DOUBLE PRECISION,
    "measurementsM3" DOUBLE PRECISION,

    CONSTRAINT "BLDraftContainer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BLDraftContainer" ADD CONSTRAINT "BLDraftContainer_bLDraftId_fkey" FOREIGN KEY ("bLDraftId") REFERENCES "BLDraft"("documentNo") ON DELETE CASCADE ON UPDATE CASCADE;
