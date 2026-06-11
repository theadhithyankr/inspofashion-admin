# Product Variant System Migration Guide

## Overview

This document guides you through migrating from the legacy color-storage system to the new normalized variant architecture. The new system ensures **every variant has both `colorName` AND `colorCode`**, eliminating the grey swatch issue on the frontend.

---

## What's Changing

### Before (Legacy)
```javascript
// Product stored colors as strings
products.colors: ["Dark Green", "Maroon"]
products.color_image_map: {
  "Dark Green": ["url1", "url2"],
  "Maroon": ["url3"]
}
// ❌ No color codes stored
// ❌ No SKU per variant
// ❌ No inventory per variant
```

### After (New System)
```javascript
// Variants stored in separate table with full metadata
product_variants {
  id, product_id, color_name, color_code, sku, stock_quantity, price, is_active
}

variant_images {
  id, variant_id, image_url, sort_order
}

// ✅ Color codes required (#RRGGBB)
// ✅ SKU per variant (globally unique)
// ✅ Inventory per variant
// ✅ Optional price override per variant
```

---

## Step 1: Run Database Migrations

### 1.1 Create New Tables

Apply this migration to your Supabase project:

```bash
# File: supabase/migrations/20260611000000_redesign_variants_system.sql
# This creates:
# - product_variants table
# - variant_images table
# - order_variants table (for order preservation)
# - Indexes and constraints
# - RLS policies
```

**To apply:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content of `20260611000000_redesign_variants_system.sql`
3. Paste and execute

Or use the Supabase CLI:
```bash
supabase db push
```

### 1.2 Migrate Existing Data

Apply the data migration script:

```bash
# File: supabase/migrations/20260611000001_migrate_existing_variants.sql
```

**What this does:**
- Converts each color in `products.colors` array to a row in `product_variants`
- Maps `color_image_map` to `variant_images` table
- Auto-generates SKUs for each variant
- Divides product quantity evenly among variants
- Maps default color codes for common colors

**To apply:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration
3. Execute

**⚠️ Important:** The migration sets default color codes for unmapped colors:
- If admin entered "Dark Green", migration looks up color code `#006400`
- If color not in mapping table, uses default `#808080` (grey)

---

## Step 2: Review Migrated Color Codes

After migration, run this query to find variants that need manual review:

```sql
SELECT DISTINCT
  pv.color_name,
  pv.color_code,
  COUNT(*) AS count
FROM public.product_variants pv
WHERE pv.color_code = '#808080'
GROUP BY pv.color_name, pv.color_code
ORDER BY count DESC;
```

**For each color with `#808080` (default):**

1. Determine the correct hex code
2. Update in Supabase:
   ```sql
   UPDATE public.product_variants
   SET color_code = '#006400'  -- Your correct hex code
   WHERE color_name = 'Dark Green'
     AND color_code = '#808080';
   ```

3. Or use the admin panel (see below)

---

## Step 3: Install Frontend Components

The system includes new components and utilities. No installation needed—they're already created:

### New Files Created

**Services:**
- `src/services/variantService.js` - Variant CRUD operations
- Updates to `src/services/productService.js` - Now queries variants

**Utilities:**
- `src/utils/colorValidator.js` - Color code validation
- Updates to `src/utils/validators.js` - Variant validation

**Hooks:**
- `src/hooks/useVariants.js` - Variant state management

**Components:**
- `src/components/products/VariantModal.jsx` - Create/edit variants
- `src/components/products/VariantList.jsx` - Display variants with actions

---

## Step 4: Update Admin Panel

### Option A: Use New Admin UI

The VariantList component is ready to be integrated into ProductModal. To use it:

1. Update `src/components/products/ProductModal.jsx`:

```javascript
import { VariantList } from './VariantList'
import { useVariants } from '../../hooks/useVariants'

export function ProductModal({ isOpen, onClose, mode = 'create', product = null, onSuccess }) {
  // ... existing code ...
  
  const { variants, createVariant, updateVariant, deleteVariant } = useVariants(product?.id)
  
  return (
    <Modal>
      {/* ... existing form fields ... */}
      
      {/* Add this section before the submit buttons */}
      <VariantList
        variants={variants}
        onAddVariant={createVariant}
        onUpdateVariant={updateVariant}
        onDeleteVariant={deleteVariant}
        productTitle={formData.title}
        loading={loading}
      />
    </Modal>
  )
}
```

### Option B: Manual Color Code Entry

If you prefer to keep the current flow temporarily, admin can:

1. Edit product in admin panel
2. See list of colors
3. For each color, click "Set Color Code" to enter hex value
4. System validates and stores

---

## Step 5: Verify Migration

Run these checks to ensure migration succeeded:

### 5.1 Count Variants Created
```sql
SELECT 
  COUNT(DISTINCT product_id) AS products_migrated,
  COUNT(*) AS total_variants_created
FROM public.product_variants;
```

Expected: Should match your product count and sum of colors per product.

### 5.2 Check for Missing Images
```sql
SELECT 
  p.title,
  pv.color_name,
  COUNT(vi.id) AS image_count
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
LEFT JOIN public.variant_images vi ON pv.id = vi.variant_id
GROUP BY p.id, p.title, pv.id, pv.color_name
HAVING COUNT(vi.id) = 0
ORDER BY p.title;
```

If results show variants without images, use admin panel to add images.

### 5.3 Validate SKU Uniqueness
```sql
SELECT sku, COUNT(*) FROM public.product_variants
GROUP BY sku
HAVING COUNT(*) > 1;
```

Expected: No results (all SKUs unique).

---

## Step 6: Test Storefront Integration

After migration, test the storefront API:

### Test Endpoint
```bash
GET /api/products/:id
```

### Expected Response
```json
{
  "id": "uuid",
  "title": "Nighty",
  "basePrice": 1299,
  "variants": [
    {
      "id": "variant-uuid",
      "colorName": "Dark Green",
      "colorCode": "#006400",
      "sku": "NIGHTY-DG-001",
      "stockQuantity": 45,
      "price": null,
      "isActive": true,
      "images": [
        {
          "id": "img-uuid",
          "url": "https://...",
          "sortOrder": 0
        }
      ]
    }
  ]
}
```

### Test in Storefront
1. Load product page
2. Select a color
3. Verify:
   - ✅ Color swatch renders with correct hex code (not grey)
   - ✅ Images load for selected color
   - ✅ SKU displays correctly
   - ✅ Stock shows accurate quantity

---

## Step 7: Admin Panel Workflow

### Creating a Product with Variants

1. **Admin Panel → Add Product**
2. **Fill basic info:** Title, description, price, category, sizes
3. **Scroll to "Color Variants" section**
4. **Click "Add Color Variant"**
5. **Modal opens:**
   - Enter color name: "Dark Green"
   - Enter color code: "#006400" (or use color picker)
   - System auto-generates SKU: "NIGHTY-DG-001"
   - Set stock quantity: 45
   - Upload images (minimum 1)
   - Click "Add Variant"
6. **Repeat for each color**
7. **Save product**

### Editing a Variant

1. **Admin Panel → Edit Product**
2. **Scroll to "Color Variants"**
3. **Click edit icon on variant**
4. **Modal opens with current data**
5. **Make changes** (all fields editable except: can't duplicate color/SKU)
6. **Click "Update Variant"**

### Deleting a Variant

1. **Admin Panel → Edit Product**
2. **Scroll to "Color Variants"**
3. **Click delete icon**
4. **Confirm deletion**

---

## Color Code Reference

Common colors and their hex codes:

```javascript
const COMMON_COLORS = {
  'White': '#FFFFFF',
  'Black': '#000000',
  'Gray': '#808080',
  'Navy': '#000080',
  'Red': '#FF0000',
  'Blue': '#0000FF',
  'Green': '#008000',
  'Yellow': '#FFFF00',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Beige': '#F5F5DC',
  'Brown': '#A52A2A',
  'Olive': '#808000',
  'Orange': '#FFA500',
  'Maroon': '#800000',
  'Dark Green': '#006400',
  'Dark Blue': '#00008B',
  'Teal': '#008080',
  'Cyan': '#00FFFF',
  'Magenta': '#FF00FF',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
}
```

---

## Troubleshooting

### Issue: "SKU already in use"
**Cause:** Generated SKU conflicts with existing SKU  
**Solution:** Edit SKU format in `generateSuggestedSKU()` function in `colorValidator.js`

### Issue: Color images not showing
**Cause:** Images weren't migrated correctly  
**Solution:**  
1. Run query to check: `SELECT COUNT(*) FROM variant_images WHERE variant_id = 'xxx'`
2. If 0 results, re-upload images via admin panel

### Issue: Some variants have code `#808080`
**Cause:** Color not in mapping table during migration  
**Solution:**
1. Identify affected colors
2. Update via SQL: `UPDATE product_variants SET color_code = '#CORRECT' WHERE color_name = 'ColorName'`
3. Or use admin panel to edit each variant

### Issue: Quantity per variant doesn't match product quantity
**Cause:** Migration divided quantity evenly among variants  
**Solution:** Adjust via admin panel for each variant, or run SQL update:
```sql
UPDATE product_variants SET stock_quantity = 100 WHERE id = 'xxx'
```

---

## Rollback Plan

If you need to revert to the old system:

1. **Backup** current variant data:
   ```sql
   CREATE TABLE product_variants_backup AS SELECT * FROM product_variants;
   CREATE TABLE variant_images_backup AS SELECT * FROM variant_images;
   ```

2. **Drop new tables:**
   ```sql
   DROP TABLE IF EXISTS order_variants;
   DROP TABLE IF EXISTS variant_images;
   DROP TABLE IF EXISTS product_variants;
   ```

3. **Revert ProductModal component** to original version

4. **Keep old color/color_image_map columns** for legacy fallback

---

## API Response Changes

### Legacy API (Old Products)
```json
{
  "id": "uuid",
  "title": "Nighty",
  "colors": ["Dark Green", "Maroon"],
  "color_image_map": {
    "Dark Green": ["url1", "url2"],
    "Maroon": ["url3"]
  }
}
```

### New API (New Products)
```json
{
  "id": "uuid",
  "title": "Nighty",
  "variants": [
    {
      "id": "variant-uuid",
      "colorName": "Dark Green",
      "colorCode": "#006400",
      "sku": "NIGHTY-DG-001",
      "stockQuantity": 45,
      "images": [{"url": "url1", "sortOrder": 0}]
    }
  ]
}
```

**Backward Compatibility:** If storefront still uses old format, use compatibility layer:
```javascript
// Convert new format to old format for legacy storefront
function toOldFormat(product) {
  return {
    colors: product.variants?.map(v => v.colorName) || [],
    color_image_map: Object.fromEntries(
      product.variants?.map(v => [v.colorName, v.images?.map(img => img.url) || []]) || []
    )
  }
}
```

---

## Performance Improvements

After migration, expect:

- **Faster product loading:** Indexed queries for variants
- **Reduced data transfer:** Specific field selection
- **Better caching:** Per-variant data isolation
- **Scalability:** Support for 100+ variants per product

---

## Next Steps

1. ✅ Run database migrations
2. ✅ Review and fix color codes
3. ✅ Integrate VariantList into ProductModal
4. ✅ Test admin panel workflow
5. ✅ Update storefront API endpoints
6. ✅ Deploy to production
7. ✅ Monitor for issues

---

## Support

For issues:
1. Check Supabase logs
2. Review query results in SQL editor
3. Check browser console for frontend errors
4. Verify RLS policies if getting permission errors

---

**Last Updated:** 2026-06-11  
**Status:** Ready for implementation
