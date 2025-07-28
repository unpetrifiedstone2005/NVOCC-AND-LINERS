/*
  Warnings:

  - You are about to drop the column `vesselName` on the `PortCall` table. All the data in the column will be lost.
  - Added the required column `vesselName` to the `Voyage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PortCall" DROP COLUMN "vesselName";

-- AlterTable
ALTER TABLE "Voyage" ADD COLUMN     "vesselName" TEXT NOT NULL;
