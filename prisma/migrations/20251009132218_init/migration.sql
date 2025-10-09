-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "supplyDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "gradeCleanA" INTEGER NOT NULL,
    "gradeCleanB" INTEGER NOT NULL,
    "rejected" INTEGER NOT NULL,
    "dust" INTEGER NOT NULL,
    "wood" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "amountInvested" DOUBLE PRECISION NOT NULL,
    "bankUsed" TEXT NOT NULL,
    "amountReceived" DOUBLE PRECISION NOT NULL,
    "riyalRate" DOUBLE PRECISION NOT NULL,
    "sharingFormula" TEXT NOT NULL,
    "containerEquivalent" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
