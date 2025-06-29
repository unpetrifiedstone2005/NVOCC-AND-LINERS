/*
  Warnings:

  - You are about to drop the column `documentId` on the `BLDraftVersion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BLDraftVersion" DROP CONSTRAINT "BLDraftVersion_documentId_fkey";

-- DropIndex
DROP INDEX "BLDraftVersion_documentId_key";

-- AlterTable
ALTER TABLE "BLDraftVersion" DROP COLUMN "documentId";
