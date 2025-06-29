-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SurchargeType" ADD VALUE 'RESIDENTIAL_DELIVERY_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'DELIVERY_AREA_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'SATURDAY_DELIVERY_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'DECLARED_VALUE_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'SIGNATURE_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'ADDRESS_CORRECTION_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'ADDITIONAL_HANDLING_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'DANGEROUS_GOODS_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'REEFER_SURCHARGE';
ALTER TYPE "SurchargeType" ADD VALUE 'WAR_RISK_SURCHARGE';
