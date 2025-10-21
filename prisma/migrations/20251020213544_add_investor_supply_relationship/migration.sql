-- AlterTable
ALTER TABLE "supplies" ADD COLUMN     "investorId" INTEGER;

-- CreateIndex
CREATE INDEX "supplies_investorId_idx" ON "supplies"("investorId");

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
