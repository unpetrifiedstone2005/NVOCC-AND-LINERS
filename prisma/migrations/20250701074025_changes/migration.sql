-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_destinationPortId_fkey";

-- DropForeignKey
ALTER TABLE "RateSheet" DROP CONSTRAINT "RateSheet_originPortId_fkey";

-- AlterTable
ALTER TABLE "RateSheet" ADD COLUMN     "destinationDepotId" TEXT,
ADD COLUMN     "originDepotId" TEXT,
ALTER COLUMN "originPortId" DROP NOT NULL,
ALTER COLUMN "destinationPortId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Depot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_originPortId_fkey" FOREIGN KEY ("originPortId") REFERENCES "Port"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_destinationPortId_fkey" FOREIGN KEY ("destinationPortId") REFERENCES "Port"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_originDepotId_fkey" FOREIGN KEY ("originDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_destinationDepotId_fkey" FOREIGN KEY ("destinationDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
