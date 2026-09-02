-- ============================================================================
-- MIGRATION: Align product_variants table with application schema
-- Created: 2026-06-11
-- Purpose: The table was created manually with different column names.
--          This migration adds all missing columns the app expects.
-- ============================================================================

-- Add color_code (was missing entirely)
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS color_code VARCHAR(7) NOT NULL DEFAULT '#808080';

-- Add stock_quantity (table has inventory_qty instead)
-- Copy existing data across, then we keep both for now so nothing breaks
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

UPDATE public.product_variants
  SET stock_quantity = inventory_qty
  WHERE stock_quantity = 0 AND inventory_qty IS NOT NULL;

-- Add price (optional, NULL = use product price)
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NULL;

-- Add is_active
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add timestamps
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Add hex validation constraint (skip if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'product_variants'
      AND constraint_name = 'valid_hex_code'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT valid_hex_code CHECK (color_code ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END $$;

-- Add CHECK on stock_quantity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'product_variants'
      AND constraint_name = 'stock_quantity_non_negative'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT stock_quantity_non_negative CHECK (stock_quantity >= 0);
  END IF;
END $$;

-- Create updated_at auto-update trigger (reuse function from migration 000000 if exists)
CREATE OR REPLACE FUNCTION update_product_variants_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_variants_timestamp ON public.product_variants;
CREATE TRIGGER trigger_update_product_variants_timestamp
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION update_product_variants_timestamp();

-- Verify: show final column list
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_variants'
ORDER BY ordinal_position;
