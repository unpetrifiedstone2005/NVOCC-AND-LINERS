/*
  Warnings:

  - A unique constraint covering the columns `[vesselId,portOfCallId,voyageNumber,operationType,etd]` on the table `VesselSchedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VesselSchedule_vesselId_portOfCallId_voyageNumber_operation_key" ON "VesselSchedule"("vesselId", "portOfCallId", "voyageNumber", "operationType", "etd");
