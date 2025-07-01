/*
  Warnings:

  - You are about to drop the column `carriersReference` on the `Booking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Booking_carriersReference_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "carriersReference";
