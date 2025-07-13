/*
  Warnings:

  - Made the column `companyName` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "companyName" SET NOT NULL,
ALTER COLUMN "postalCode" DROP NOT NULL;
