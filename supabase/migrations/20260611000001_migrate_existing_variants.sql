-- ============================================================================
-- DATA MIGRATION: Migrate existing color data to product_variants table
-- Created: 2026-06-11
-- Purpose: Convert legacy color/color_image_map data to new normalized structure
-- ============================================================================

-- Step 1: Create temporary table to hold color mappings
-- This is a reference for default color codes
CREATE TEMPORARY TABLE color_code_mapping AS
SELECT * FROM (
  VALUES
    ('White', '#FFFFFF'),
    ('Black', '#000000'),
    ('Gray', '#808080'),
    ('Grey', '#808080'),
    ('Navy', '#000080'),
    ('Red', '#FF0000'),
    ('Blue', '#0000FF'),
    ('Green', '#008000'),
    ('Yellow', '#FFFF00'),
    ('Pink', '#FFC0CB'),
    ('Purple', '#800080'),
    ('Beige', '#F5F5DC'),
    ('Brown', '#A52A2A'),
    ('Olive', '#808000'),
    ('Orange', '#FFA500'),
    ('Maroon', '#800000'),
    ('Dark Green', '#006400'),
    ('Dark Blue', '#00008B'),
    ('Light Blue', '#ADD8E6'),
    ('Teal', '#008080'),
    ('Cyan', '#00FFFF'),
    ('Magenta', '#FF00FF'),
    ('Lime', '#00FF00'),
    ('Indigo', '#4B0082'),
    ('Violet', '#EE82EE'),
    ('Gold', '#FFD700'),
    ('Silver', '#C0C0C0'),
    ('Khaki', '#F0E68C'),
    ('Coral', '#FF7F50'),
    ('Turquoise', '#40E0D0')
) AS t(color_name, color_code);

-- Step 2: Migrate colors from products table to product_variants
-- This query:
-- 1. Expands each product's colors array into individual rows
-- 2. Looks up color codes from mapping table
-- 3. Auto-generates SKU from product title and color
-- 4. Divides product quantity evenly across variants
-- 5. Maintains color_image_map relationships

INSERT INTO public.product_variants (
  product_id,
  color_name,
  color_code,
  sku,
  stock_quantity,
  price,
  is_active,
  created_at,
  updated_at
)
SELECT
  p.id,
  color_name,
  COALESCE(ccm.color_code, '#808080') AS color_code, -- Default to gray if not mapped
  -- Generate SKU: PRODUCT-SHORT-COLORINDEX
  -- e.g., NIGHTY-001, NIGHTY-002
  UPPER(SUBSTR(
    REGEXP_REPLACE(p.title, '[^A-Za-z0-9]', ''),
    1,
    3
  )) || '-' || 
  LPAD(
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY color_name))::text,
    3,
    '0'
  ) AS sku,
  -- Divide product quantity evenly among variants
  GREATEST(
    1,
    p.quantity / (SELECT COUNT(*) FROM jsonb_array_elements_text(p.colors))
  ) AS stock_quantity,
  NULL AS price, -- NULL means use product price
  p.is_active,
  p.created_at,
  p.updated_at
FROM public.products p
CROSS JOIN LATERAL jsonb_array_elements_text(p.colors) AS color_name
LEFT JOIN color_code_mapping ccm ON LOWER(ccm.color_name) = LOWER(color_name)
ON CONFLICT DO NOTHING; -- Skip if variant already exists

-- Step 3: Migrate variant images from color_image_map to variant_images table
INSERT INTO public.variant_images (
  variant_id,
  image_url,
  sort_order,
  created_at
)
SELECT
  pv.id,
  image_url,
  ROW_NUMBER() OVER (PARTITION BY pv.id ORDER BY image_position) - 1 AS sort_order,
  NOW()
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
CROSS JOIN LATERAL jsonb_each(p.color_image_map) AS color_entry(color_name, images)
CROSS JOIN LATERAL jsonb_array_elements_text(color_entry.images) WITH ORDINALITY AS image_data(image_url, image_position)
WHERE LOWER(color_entry.color_name) = LOWER(pv.color_name)
  AND image_url IS NOT NULL
  AND image_url != ''
ON CONFLICT DO NOTHING;

-- Step 4: Add fallback images for colors without mapped images
-- If a color has no images in color_image_map, use product's primary image
INSERT INTO public.variant_images (
  variant_id,
  image_url,
  sort_order,
  created_at
)
SELECT
  pv.id,
  p.image_url,
  0,
  NOW()
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
WHERE p.image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.variant_images vi WHERE vi.variant_id = pv.id
  )
ON CONFLICT DO NOTHING;

-- Step 5: Validate migration
-- Check for variants without images
SELECT 
  pv.id,
  pv.product_id,
  pv.color_name,
  p.title,
  'NO IMAGES' AS warning
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.variant_images vi WHERE vi.variant_id = pv.id
);

-- Step 6: Summary of migration
SELECT 
  COUNT(DISTINCT product_id) AS products_with_variants,
  COUNT(*) AS total_variants,
  SUM(CASE WHEN color_code = '#808080' THEN 1 ELSE 0 END) AS variants_with_default_code
FROM public.product_variants;

-- Step 7: Log any color codes that need manual review
SELECT DISTINCT
  pv.color_name,
  pv.color_code,
  COUNT(*) AS usage_count
FROM public.product_variants pv
WHERE pv.color_code = '#808080' -- Default/fallback code
GROUP BY pv.color_name, pv.color_code
ORDER BY usage_count DESC;

-- NOTES FOR ADMIN:
-- 1. Review the queries above for any color codes set to default (#808080)
-- 2. For each color with default code, admin should set correct hex code
-- 3. Update using: UPDATE product_variants SET color_code = '#CORRECTCODE' WHERE color_name = 'ColorName'
-- 4. Verify SKU uniqueness if SKU generation creates conflicts (rare but possible)
-- 5. After verification, you can remove the old color/color_image_map columns from products table
