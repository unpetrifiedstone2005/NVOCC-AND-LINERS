/*
  Warnings:

  - Added the required column `snapshot` to the `BLDraftVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BLDraftVersion" ADD COLUMN     "snapshot" JSONB NOT NULL;
