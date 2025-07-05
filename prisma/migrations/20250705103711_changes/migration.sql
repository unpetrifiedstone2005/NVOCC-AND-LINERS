-- AlterEnum
ALTER TYPE "SurchargeScope" ADD VALUE 'DOCUMENTAION';

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_quotationId_fkey";
