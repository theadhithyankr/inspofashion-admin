-- ============================================================================
-- PRODUCT VARIANT SYSTEM REDESIGN MIGRATION
-- Created: 2026-06-11
-- Purpose: Normalize variant storage with proper validation and relationships
-- ============================================================================

-- Step 1: Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Variant identification (both required)
  color_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  
  -- SKU tracking
  sku VARCHAR(50) NOT NULL UNIQUE,
  
  -- Inventory management
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  
  -- Pricing (NULL = use product price)
  price DECIMAL(10, 2) NULL,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_hex_code CHECK (color_code ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT unique_color_per_product UNIQUE(product_id, color_code),
  CONSTRAINT unique_color_name_per_product UNIQUE(product_id, color_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

-- Step 2: Create variant_images table
CREATE TABLE IF NOT EXISTS public.variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  image_url VARCHAR NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_variant_image UNIQUE(variant_id, image_url)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id ON public.variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_sort ON public.variant_images(variant_id, sort_order);

-- Step 3: Create order_variants table (for order preservation)
-- This table captures variant data at the time of order
CREATE TABLE IF NOT EXISTS public.order_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL, -- Will reference orders table when it exists
  
  -- Captured at order time (immutable snapshot)
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Denormalized for historical accuracy
  color_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  price_paid DECIMAL(10, 2) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_order_hex CHECK (color_code ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_variants_order_id ON public.order_variants(order_id);
CREATE INDEX IF NOT EXISTS idx_order_variants_product_id ON public.order_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_order_variants_variant_id ON public.order_variants(variant_id);

-- Step 4: Add comments for documentation
COMMENT ON TABLE public.product_variants IS
'Stores individual color variants for each product. Each variant must have both color_name and color_code (hex).
Enables per-variant tracking of SKU, stock, and pricing.';

COMMENT ON COLUMN public.product_variants.color_name IS
'Human-readable color name (e.g., "Dark Green"). Must be unique per product.';

COMMENT ON COLUMN public.product_variants.color_code IS
'Hex color code in #RRGGBB format (e.g., "#006400"). Must be valid hex and unique per product.';

COMMENT ON COLUMN public.product_variants.sku IS
'Stock Keeping Unit - unique identifier for this variant globally. Format: PRODUCT-VARIANT-NUMBER';

COMMENT ON COLUMN public.product_variants.stock_quantity IS
'Number of units in stock for this specific variant. Can be 0 (out of stock).';

COMMENT ON TABLE public.variant_images IS
'Maps images to specific variants. Allows different images for different colors.';

COMMENT ON TABLE public.order_variants IS
'Historical snapshot of variant data at time of order. Preserves product/variant info even if product is deleted.';

-- Step 5: Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_product_variants_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_product_variants_timestamp ON public.product_variants;
CREATE TRIGGER trigger_update_product_variants_timestamp
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_variants_timestamp();

-- Step 6: Enable RLS (Row Level Security) if needed
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_variants ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should match existing products table policies
-- Customize based on your auth setup (admin-only access, etc.)
