-- AlterTable
ALTER TABLE "exports" ADD COLUMN     "arrivalClearingAgent" VARCHAR(100),
ADD COLUMN     "arrivalClearingFee" DECIMAL(12,2),
ADD COLUMN     "departureClearingAgent" VARCHAR(100),
ADD COLUMN     "departureClearingFee" DECIMAL(12,2);
