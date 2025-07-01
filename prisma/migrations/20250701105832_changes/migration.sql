/*
  Warnings:

  - A unique constraint covering the columns `[carriersReference]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_carriersReference_key" ON "Booking"("carriersReference");
