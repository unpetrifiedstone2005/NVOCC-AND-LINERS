/*
  Warnings:

  - A unique constraint covering the columns `[voyageNumber]` on the table `Voyage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Voyage_voyageNumber_key" ON "Voyage"("voyageNumber");
