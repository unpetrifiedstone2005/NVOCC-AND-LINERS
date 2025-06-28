-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "certificationExpiry" TIMESTAMP(3),
ADD COLUMN     "cscPlateUrl" TEXT,
ADD COLUMN     "foodGrade" BOOLEAN,
ADD COLUMN     "imoClass" TEXT,
ADD COLUMN     "reefer" BOOLEAN;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "socDetails" JSONB;
