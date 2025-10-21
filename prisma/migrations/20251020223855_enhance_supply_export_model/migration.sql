-- DropForeignKey
ALTER TABLE "public"."supply_exports" DROP CONSTRAINT "supply_exports_export_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."supply_exports" DROP CONSTRAINT "supply_exports_supply_id_fkey";

-- AlterTable
ALTER TABLE "supply_exports" ADD COLUMN     "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "supply_exports_allocatedAt_idx" ON "supply_exports"("allocatedAt");

-- CreateIndex
CREATE INDEX "supply_exports_priority_idx" ON "supply_exports"("priority");

-- CreateIndex
CREATE INDEX "supply_exports_quantityBags_idx" ON "supply_exports"("quantityBags");

-- AddForeignKey
ALTER TABLE "supply_exports" ADD CONSTRAINT "supply_exports_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_exports" ADD CONSTRAINT "supply_exports_export_id_fkey" FOREIGN KEY ("export_id") REFERENCES "exports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
