-- AlterTable
ALTER TABLE "RateSheet" ADD COLUMN     "isDangerousGoods" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Surcharge" ADD COLUMN     "appliesToDG" BOOLEAN NOT NULL DEFAULT false;
