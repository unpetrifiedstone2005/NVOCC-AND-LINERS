/*
  Warnings:

  - You are about to drop the `DeliveryOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DeliveryOrderRecipientType" AS ENUM ('TRUCKER', 'CONSIGNEE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryOrderStatus" AS ENUM ('PENDING', 'ISSUED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "DeliveryOrder" DROP CONSTRAINT "DeliveryOrder_bookingId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "deliveryOrderId" TEXT;

-- DropTable
DROP TABLE "DeliveryOrder";

-- CreateTable
CREATE TABLE "delivery_order" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "recipientType" "DeliveryOrderRecipientType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "deliveryLocation" TEXT,
    "status" "DeliveryOrderStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_order_bookingId_key" ON "delivery_order"("bookingId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "delivery_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order" ADD CONSTRAINT "delivery_order_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
