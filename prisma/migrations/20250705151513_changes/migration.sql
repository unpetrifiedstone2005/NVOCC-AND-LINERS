-- CreateTable
CREATE TABLE "ShippingInstructionContainer" (
    "id" TEXT NOT NULL,
    "shippingInstructionId" TEXT NOT NULL,
    "containerNumber" TEXT,
    "seals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marksAndNumbers" TEXT,
    "hsCode" TEXT,

    CONSTRAINT "ShippingInstructionContainer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShippingInstruction" ADD CONSTRAINT "ShippingInstruction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInstructionContainer" ADD CONSTRAINT "ShippingInstructionContainer_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
