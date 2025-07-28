/*
  Warnings:

  - A unique constraint covering the columns `[serviceId,voyageNumber]` on the table `Voyage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Voyage_voyageNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Voyage_serviceId_voyageNumber_key" ON "Voyage"("serviceId", "voyageNumber");
