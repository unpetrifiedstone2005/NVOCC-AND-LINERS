/*
  Warnings:

  - The primary key for the `BLDraft` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `BLDraft` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "BLDraftComment" DROP CONSTRAINT "BLDraftComment_draftNo_fkey";

-- DropForeignKey
ALTER TABLE "BLDraftContainer" DROP CONSTRAINT "BLDraftContainer_bLDraftId_fkey";

-- DropForeignKey
ALTER TABLE "BLDraftVersion" DROP CONSTRAINT "BLDraftVersion_draftNo_fkey";

-- AlterTable
ALTER TABLE "BLDraft" DROP CONSTRAINT "BLDraft_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "BLDraft_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "BLDraftContainer" ADD CONSTRAINT "BLDraftContainer_bLDraftId_fkey" FOREIGN KEY ("bLDraftId") REFERENCES "BLDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftVersion" ADD CONSTRAINT "BLDraftVersion_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "BLDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftComment" ADD CONSTRAINT "BLDraftComment_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "BLDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
