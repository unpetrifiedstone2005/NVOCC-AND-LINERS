-- AlterTable
ALTER TABLE "BLDraftCargo" ADD COLUMN     "customerLoadReference" TEXT,
ADD COLUMN     "imoClass" TEXT,
ADD COLUMN     "isDangerous" BOOLEAN,
ADD COLUMN     "marksAndNumbers" TEXT,
ADD COLUMN     "outerPacking" TEXT,
ADD COLUMN     "packingGroup" TEXT,
ADD COLUMN     "sealNo" TEXT,
ADD COLUMN     "sealNoOptional" TEXT,
ADD COLUMN     "unNumber" TEXT;
