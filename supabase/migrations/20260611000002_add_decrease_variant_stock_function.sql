-- ============================================================================
-- MIGRATION: Add decrease_variant_stock RPC function
-- Created: 2026-06-11
-- Purpose: Safely decrease a variant's stock_quantity for order processing.
--          Raises an error rather than letting stock go negative.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.decrease_variant_stock(
  v_variant_id UUID,
  v_amount     INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Lock the row for the duration of this transaction to prevent races
  SELECT stock_quantity
    INTO v_current_stock
    FROM public.product_variants
   WHERE id = v_variant_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', v_variant_id;
  END IF;

  IF v_current_stock < v_amount THEN
    RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, requested: %',
      v_variant_id, v_current_stock, v_amount;
  END IF;

  UPDATE public.product_variants
     SET stock_quantity = stock_quantity - v_amount
   WHERE id = v_variant_id;
END;
$$;

COMMENT ON FUNCTION public.decrease_variant_stock(UUID, INTEGER) IS
'Decreases stock_quantity for a variant by the given amount.
Raises an exception if the variant does not exist or if there is insufficient stock.
Uses SELECT FOR UPDATE to prevent concurrent over-selling.';
