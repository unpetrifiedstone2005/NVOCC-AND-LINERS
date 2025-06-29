/*
  Warnings:

  - You are about to drop the column `dgClass` on the `Declaration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Declaration" DROP COLUMN "dgClass",
ADD COLUMN     "imoClass" TEXT;
