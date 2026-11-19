-- Apply after `prisma db push`, or include in your team's initial Prisma migration.
-- This file is idempotent and contains the SQL-only invariants of 03-database.md.
CREATE UNIQUE INDEX IF NOT EXISTS "AllocationPlan_active_per_rfq" ON "AllocationPlan" ("rfqId")
  WHERE "status" IN ('DRAFT', 'PENDING_BUYER', 'ACCEPTED');
CREATE UNIQUE INDEX IF NOT EXISTS "ProductImage_one_primary_per_product" ON "ProductImage" ("productId")
  WHERE "isPrimary" = true;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Product_price_nonneg') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_price_nonneg" CHECK ("price" IS NULL OR "price" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Rfq_quantity_positive') THEN
    ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_quantity_positive" CHECK ("quantity" > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='BatchProduct_quantity_positive') THEN
    ALTER TABLE "BatchProduct" ADD CONSTRAINT "BatchProduct_quantity_positive" CHECK ("quantity" > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ProductionMilestone_orderIndex_nonneg') THEN
    ALTER TABLE "ProductionMilestone" ADD CONSTRAINT "ProductionMilestone_orderIndex_nonneg" CHECK ("orderIndex" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Bid_positive_values') THEN
    ALTER TABLE "Bid" ADD CONSTRAINT "Bid_positive_values" CHECK ("quantityOffered" > 0 AND "unitPrice" > 0 AND "leadTimeDays" > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='AllocationPlanItem_quantity_positive') THEN
    ALTER TABLE "AllocationPlanItem" ADD CONSTRAINT "AllocationPlanItem_quantity_positive" CHECK ("quantity" > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ProductionTask_quantity_bounds') THEN
    ALTER TABLE "ProductionTask" ADD CONSTRAINT "ProductionTask_quantity_bounds" CHECK ("quantity" > 0 AND "completedQuantity" BETWEEN 0 AND "quantity");
  END IF;
END $$;
