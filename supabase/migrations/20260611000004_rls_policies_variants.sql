-- ============================================================================
-- MIGRATION: RLS policies for product_variants and variant_images
-- Created: 2026-06-11
-- Rules:
--   anon (storefront)     → SELECT only
--   authenticated (admin) → full access (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================

-- ── product_variants ─────────────────────────────────────────────────────────

-- Drop any existing policies so this migration is idempotent
DROP POLICY IF EXISTS "allow_all_variants"              ON public.product_variants;
DROP POLICY IF EXISTS "public_read_variants"            ON public.product_variants;
DROP POLICY IF EXISTS "authenticated_write_variants"    ON public.product_variants;
DROP POLICY IF EXISTS "anon_read"                       ON public.product_variants;
DROP POLICY IF EXISTS "admin_full_access"               ON public.product_variants;

-- Storefront: read active variants only
CREATE POLICY "storefront_read_variants"
  ON public.product_variants
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Admin: full access (requires a valid Supabase Auth session)
CREATE POLICY "admin_all_variants"
  ON public.product_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── variant_images ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_all_variant_images"        ON public.variant_images;
DROP POLICY IF EXISTS "public_read_variant_images"      ON public.variant_images;
DROP POLICY IF EXISTS "authenticated_write_images"      ON public.variant_images;

-- Storefront: read images for active variants only
CREATE POLICY "storefront_read_variant_images"
  ON public.variant_images
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_variants pv
      WHERE pv.id = variant_images.variant_id
        AND pv.is_active = true
    )
  );

-- Admin: full access
CREATE POLICY "admin_all_variant_images"
  ON public.variant_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Table-level grants (required even with RLS policies) ─────────────────────

GRANT SELECT                       ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

GRANT SELECT                       ON public.variant_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variant_images TO authenticated;
