-- DropForeignKey
ALTER TABLE "WeightBracket" DROP CONSTRAINT "WeightBracket_rateSheetId_fkey";

-- AddForeignKey
ALTER TABLE "WeightBracket" ADD CONSTRAINT "WeightBracket_rateSheetId_fkey" FOREIGN KEY ("rateSheetId") REFERENCES "RateSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
