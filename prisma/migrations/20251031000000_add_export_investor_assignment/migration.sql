-- Add investor assignment to exports
ALTER TABLE "exports" ADD COLUMN "assigned_investor_id" INTEGER;

-- Add foreign key constraint
ALTER TABLE "exports" ADD CONSTRAINT "exports_assigned_investor_id_fkey" 
FOREIGN KEY ("assigned_investor_id") REFERENCES "investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "exports_assigned_investor_id_idx" ON "exports"("assigned_investor_id");