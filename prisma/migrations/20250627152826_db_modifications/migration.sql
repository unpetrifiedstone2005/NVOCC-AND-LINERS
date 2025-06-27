/*
  Warnings:

  - Changed the type of `surchargeType` on the `Surcharge` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SurchargeType" AS ENUM ('BASE_FREIGHT', 'BUNKER_ADJUSTMENT_FACTOR', 'CURRENCY_ADJUSTMENT_FACTOR', 'TERMINAL_HANDLING_CHARGE', 'PEAK_SEASON_SURCHARGE', 'SECURITY_ISPS_SURCHARGE', 'PORT_CONGESTION_SURCHARGE', 'OVERWEIGHT_OUT_OF_GAUGE_CHARGE', 'DOCUMENTATION_ADMIN_FEE', 'EMERGENCY_RISK_SURCHARGE');

-- AlterTable
ALTER TABLE "Surcharge" DROP COLUMN "surchargeType",
ADD COLUMN     "surchargeType" "SurchargeType" NOT NULL;
