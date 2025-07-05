/*
  Warnings:

  - You are about to drop the column `commodity` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `contractNumber` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `contractValidTo` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `contractualParty` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `contractualPartyAddress` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `customerAddress` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `customsDetails` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryType` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `transitWeeks` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `cargoDescription` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `dangerousGoods` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `imoClass` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `releaseTime` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `unNumber` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `weightUnit` on the `BookingContainer` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `Cargo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BLDraft" DROP CONSTRAINT "BLDraft_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Cargo" DROP CONSTRAINT "Cargo_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "ContainerReleaseOrder" DROP CONSTRAINT "ContainerReleaseOrder_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Declaration" DROP CONSTRAINT "Declaration_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Refunded" DROP CONSTRAINT "Refunded_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "ShippingInstruction" DROP CONSTRAINT "ShippingInstruction_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowTask" DROP CONSTRAINT "WorkflowTask_bookingId_fkey";

-- DropIndex
DROP INDEX "Cargo_bookingContainerId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "commodity",
DROP COLUMN "contractNumber",
DROP COLUMN "contractValidTo",
DROP COLUMN "contractualParty",
DROP COLUMN "contractualPartyAddress",
DROP COLUMN "customerAddress",
DROP COLUMN "customsDetails",
DROP COLUMN "deliveryDate",
DROP COLUMN "deliveryType",
DROP COLUMN "pickupDate",
DROP COLUMN "transitWeeks";

-- AlterTable
ALTER TABLE "BookingContainer" DROP COLUMN "cargoDescription",
DROP COLUMN "dangerousGoods",
DROP COLUMN "imoClass",
DROP COLUMN "releaseTime",
DROP COLUMN "unNumber",
DROP COLUMN "weight",
DROP COLUMN "weightUnit",
ALTER COLUMN "shipperOwned" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Cargo" DROP COLUMN "bookingId";
