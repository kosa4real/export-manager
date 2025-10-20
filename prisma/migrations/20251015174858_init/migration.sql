-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'INVESTOR');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('BALANCED', 'OVERPAID', 'UNDERPAID');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvestorStatus" AS ENUM ('ACTIVE', 'RETURNED', 'PARTIAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "investorId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contactInfo" VARCHAR(100),
    "email" VARCHAR(100),
    "fullAddress" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplies" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "supplyDate" TIMESTAMP(3) NOT NULL,
    "quantityBags" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'BALANCED',
    "balanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gradeA" INTEGER NOT NULL DEFAULT 0,
    "gradeB" INTEGER NOT NULL DEFAULT 0,
    "rejectedBags" INTEGER NOT NULL DEFAULT 0,
    "dustBags" INTEGER NOT NULL DEFAULT 0,
    "woodBags" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" SERIAL NOT NULL,
    "exportDate" TIMESTAMP(3) NOT NULL,
    "quantityBags" INTEGER NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "destinationCountry" VARCHAR(100) NOT NULL,
    "destinationCity" VARCHAR(100) NOT NULL,
    "clearingAgent" VARCHAR(100),
    "buyer" VARCHAR(100),
    "amountReceived" DECIMAL(12,2),
    "clearingFee" DECIMAL(12,2),
    "netProfit" DECIMAL(12,2),
    "containerNumber" VARCHAR(50),
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contactInfo" VARCHAR(100),
    "email" VARCHAR(100),
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "amountInvested" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "bankName" VARCHAR(100) NOT NULL,
    "amountReceived" DECIMAL(12,2) NOT NULL,
    "exchangeRate" DECIMAL(8,4) NOT NULL,
    "profitShare" VARCHAR(50) NOT NULL,
    "containerEquivalent" DECIMAL(10,2),
    "status" "InvestorStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_exports" (
    "supply_id" INTEGER NOT NULL,
    "export_id" INTEGER NOT NULL,
    "quantityBags" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_exports_pkey" PRIMARY KEY ("supply_id","export_id")
);

-- CreateTable
CREATE TABLE "data_requests" (
    "id" SERIAL NOT NULL,
    "investorId" INTEGER NOT NULL,
    "dataType" VARCHAR(50) NOT NULL,
    "recordIds" INTEGER[],
    "includeSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" VARCHAR(255),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_investorId_key" ON "users"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "supplies_supplierId_idx" ON "supplies"("supplierId");

-- CreateIndex
CREATE INDEX "supplies_supplyDate_idx" ON "supplies"("supplyDate");

-- CreateIndex
CREATE UNIQUE INDEX "supplies_supplierId_supplyDate_key" ON "supplies"("supplierId", "supplyDate");

-- CreateIndex
CREATE UNIQUE INDEX "exports_containerNumber_key" ON "exports"("containerNumber");

-- CreateIndex
CREATE INDEX "exports_exportDate_idx" ON "exports"("exportDate");

-- CreateIndex
CREATE INDEX "exports_destinationCountry_idx" ON "exports"("destinationCountry");

-- CreateIndex
CREATE INDEX "exports_departureDate_idx" ON "exports"("departureDate");

-- CreateIndex
CREATE INDEX "investors_investmentDate_idx" ON "investors"("investmentDate");

-- CreateIndex
CREATE INDEX "investors_status_idx" ON "investors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "investors_name_investmentDate_key" ON "investors"("name", "investmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "data_requests_token_key" ON "data_requests"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_exports" ADD CONSTRAINT "supply_exports_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_exports" ADD CONSTRAINT "supply_exports_export_id_fkey" FOREIGN KEY ("export_id") REFERENCES "exports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
