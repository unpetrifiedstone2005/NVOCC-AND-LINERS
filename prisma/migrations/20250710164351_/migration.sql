/*
  Warnings:

  - A unique constraint covering the columns `[blDraftVersionId]` on the table `EGM` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blDraftVersionId` to the `EGM` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EGM" ADD COLUMN     "blDraftVersionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EGM_blDraftVersionId_key" ON "EGM"("blDraftVersionId");

-- AddForeignKey
ALTER TABLE "EGM" ADD CONSTRAINT "EGM_blDraftVersionId_fkey" FOREIGN KEY ("blDraftVersionId") REFERENCES "BLDraftVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
