/*
  Warnings:

  - You are about to drop the column `additionalInformation` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `additionalNotifyParty` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `authorizedSignatory` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `carrierName` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `carriersReference` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `consignee` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `consignmentTotal` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `containerNumbers` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionOfGoods` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `finalDestination` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `freightCharges` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `grossWeightKg` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `incoterms2020` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `kindAndNoOfPackages` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `marksAndNumbers` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `measurementsM3` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `netWeightKg` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `noOfOriginalBLs` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `notifyParty` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `payableAt` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `placeAndDateOfIssue` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `placeOfDelivery` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `placeOfReceipt` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `portOfDischarge` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `portOfLoading` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `preCarriageBy` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `sealNumbers` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `shippedOnBoardDate` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `shipper` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `shippersReference` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `signatoryCompany` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `signature` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `sizeType` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `termsAndConditions` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `totalNoOfContainersText` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `totalThisPage` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueConsignmentRef` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `vesselOrAircraft` on the `BLDraft` table. All the data in the column will be lost.
  - You are about to drop the column `voyageNo` on the `BLDraft` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BLDraft" DROP COLUMN "additionalInformation",
DROP COLUMN "additionalNotifyParty",
DROP COLUMN "authorizedSignatory",
DROP COLUMN "carrierName",
DROP COLUMN "carriersReference",
DROP COLUMN "consignee",
DROP COLUMN "consignmentTotal",
DROP COLUMN "containerNumbers",
DROP COLUMN "descriptionOfGoods",
DROP COLUMN "finalDestination",
DROP COLUMN "freightCharges",
DROP COLUMN "grossWeightKg",
DROP COLUMN "incoterms2020",
DROP COLUMN "kindAndNoOfPackages",
DROP COLUMN "marksAndNumbers",
DROP COLUMN "measurementsM3",
DROP COLUMN "netWeightKg",
DROP COLUMN "noOfOriginalBLs",
DROP COLUMN "notifyParty",
DROP COLUMN "payableAt",
DROP COLUMN "placeAndDateOfIssue",
DROP COLUMN "placeOfDelivery",
DROP COLUMN "placeOfReceipt",
DROP COLUMN "portOfDischarge",
DROP COLUMN "portOfLoading",
DROP COLUMN "preCarriageBy",
DROP COLUMN "sealNumbers",
DROP COLUMN "shippedOnBoardDate",
DROP COLUMN "shipper",
DROP COLUMN "shippersReference",
DROP COLUMN "signatoryCompany",
DROP COLUMN "signature",
DROP COLUMN "sizeType",
DROP COLUMN "termsAndConditions",
DROP COLUMN "totalNoOfContainersText",
DROP COLUMN "totalThisPage",
DROP COLUMN "uniqueConsignmentRef",
DROP COLUMN "vesselOrAircraft",
DROP COLUMN "voyageNo";
