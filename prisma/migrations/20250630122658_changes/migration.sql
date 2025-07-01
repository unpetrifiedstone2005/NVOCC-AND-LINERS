-- CreateTable
CREATE TABLE "BLDraftCargo" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION,
    "grossVolume" DOUBLE PRECISION,
    "noOfPackages" INTEGER,
    "netWeight" DOUBLE PRECISION,
    "netVolume" DOUBLE PRECISION,

    CONSTRAINT "BLDraftCargo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BLDraftCargo" ADD CONSTRAINT "BLDraftCargo_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "BLDraftContainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
