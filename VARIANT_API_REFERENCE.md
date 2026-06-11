# Variant System API Reference

## Quick Start

### 1. Using Variant Service

```javascript
import { variantService } from '@/services/variantService'

// Get all variants for a product
const variants = await variantService.getVariantsByProductId(productId)

// Create variant
const newVariant = await variantService.createVariant({
  productId: 'product-uuid',
  colorName: 'Dark Green',
  colorCode: '#006400',
  sku: 'NIGHTY-DG-001',
  stockQuantity: 45,
  price: null, // Optional - null uses product price
  images: [
    { url: 'https://example.com/dark-green-1.jpg' },
    { url: 'https://example.com/dark-green-2.jpg' }
  ]
})
```

### 2. Using Variant Hook

```javascript
import { useVariants } from '@/hooks/useVariants'

function MyComponent({ productId }) {
  const { 
    variants, 
    loading, 
    error,
    createVariant,
    updateVariant,
    deleteVariant 
  } = useVariants(productId)

  return (
    <div>
      {variants.map(v => (
        <div key={v.id}>
          <h3>{v.colorName}</h3>
          <p>{v.colorCode}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. Using VariantList Component

```javascript
import { VariantList } from '@/components/products/VariantList'

<VariantList
  variants={variants}
  onAddVariant={handleAddVariant}
  onUpdateVariant={handleUpdateVariant}
  onDeleteVariant={handleDeleteVariant}
  productTitle="Nighty"
  loading={isLoading}
/>
```

---

## Service Methods

### `getVariantsByProductId(productId: string): Promise<Array>`

Get all variants for a product with images.

**Parameters:**
- `productId` (string, required) - Product UUID

**Returns:**
```javascript
[
  {
    id: 'variant-uuid',
    productId: 'product-uuid',
    colorName: 'Dark Green',
    colorCode: '#006400',
    sku: 'NIGHTY-DG-001',
    stockQuantity: 45,
    price: null,
    isActive: true,
    images: [
      { id: 'img-uuid', url: '...', sortOrder: 0 },
      { id: 'img-uuid', url: '...', sortOrder: 1 }
    ],
    createdAt: '2026-06-11T10:00:00Z',
    updatedAt: '2026-06-11T10:00:00Z'
  }
]
```

**Example:**
```javascript
const variants = await variantService.getVariantsByProductId('abc-123')
console.log(`Product has ${variants.length} variants`)
```

---

### `getVariant(variantId: string): Promise<Object>`

Get a single variant by ID with images.

**Parameters:**
- `variantId` (string, required) - Variant UUID

**Returns:** Single variant object (see structure above)

**Example:**
```javascript
const variant = await variantService.getVariant('variant-uuid')
console.log(`${variant.colorName}: ${variant.sku}`)
```

---

### `createVariant(variantData: Object): Promise<Object>`

Create a new variant with images.

**Parameters:**
```javascript
{
  productId: string (required),
  colorName: string (required, 2-50 chars),
  colorCode: string (required, hex format #RRGGBB),
  sku: string (required, 5-50 chars, globally unique),
  stockQuantity: number (required, >= 0),
  price: number | null (optional, null = use product price),
  isActive: boolean (optional, default true),
  images: Array<{ url: string }> (optional)
}
```

**Returns:** Created variant object

**Validation:**
- Color name: 2-50 chars, alphanumeric + spaces
- Color code: Valid hex format (#RRGGBB)
- SKU: 5-50 chars, globally unique (enforced)
- Stock: Integer >= 0

**Example:**
```javascript
const variant = await variantService.createVariant({
  productId: 'product-123',
  colorName: 'Maroon',
  colorCode: '#800000',
  sku: 'NIGHTY-MR-001',
  stockQuantity: 32,
  price: null,
  images: [
    { url: 'https://cdn.example.com/maroon-1.jpg' }
  ]
})
```

**Throws:**
```javascript
// SKU already exists
Error: "Duplicate key value violates unique constraint"

// Invalid color code
Error: "new row violates check constraint \"valid_hex_code\""
```

---

### `updateVariant(variantId: string, updates: Object): Promise<Object>`

Update an existing variant.

**Parameters:**
- `variantId` (string, required) - Variant UUID
- `updates` (object, required) - Fields to update:
  ```javascript
  {
    colorName: string,
    colorCode: string,
    sku: string,
    stockQuantity: number,
    price: number | null,
    isActive: boolean
  }
  ```

**Returns:** Updated variant object

**Example:**
```javascript
const updated = await variantService.updateVariant('variant-uuid', {
  stockQuantity: 50,
  price: 1399
})
```

---

### `deleteVariant(variantId: string): Promise<void>`

Delete a variant (cascade deletes images).

**Parameters:**
- `variantId` (string, required) - Variant UUID

**Example:**
```javascript
await variantService.deleteVariant('variant-uuid')
// All related images are automatically deleted
```

---

### `toggleVariantActive(variantId: string, isActive: boolean): Promise<Object>`

Toggle variant active status.

**Parameters:**
- `variantId` (string, required)
- `isActive` (boolean, required)

**Returns:** Updated variant object

**Example:**
```javascript
const updated = await variantService.toggleVariantActive('variant-uuid', false)
console.log(`Variant is now ${updated.isActive ? 'active' : 'inactive'}`)
```

---

### `addVariantImages(variantId: string, imageUrls: Array<string>): Promise<Array>`

Add images to a variant.

**Parameters:**
- `variantId` (string, required)
- `imageUrls` (array of strings, required) - Image URLs to add

**Returns:**
```javascript
[
  { id: 'img-uuid', url: '...', sortOrder: 3 },
  { id: 'img-uuid', url: '...', sortOrder: 4 }
]
```

**Example:**
```javascript
const images = await variantService.addVariantImages('variant-uuid', [
  'https://cdn.example.com/img1.jpg',
  'https://cdn.example.com/img2.jpg'
])
```

---

### `removeVariantImage(imageId: string): Promise<void>`

Remove a specific image from a variant.

**Parameters:**
- `imageId` (string, required) - Image UUID

**Example:**
```javascript
await variantService.removeVariantImage('img-uuid')
```

---

### `reorderVariantImages(variantId: string, imageOrder: Array): Promise<void>`

Reorder variant images.

**Parameters:**
- `variantId` (string, required)
- `imageOrder` (array, required):
  ```javascript
  [
    { id: 'img-uuid-1', sortOrder: 0 },
    { id: 'img-uuid-2', sortOrder: 1 },
    { id: 'img-uuid-3', sortOrder: 2 }
  ]
  ```

**Example:**
```javascript
await variantService.reorderVariantImages('variant-uuid', [
  { id: 'img-1', sortOrder: 2 },
  { id: 'img-2', sortOrder: 0 },
  { id: 'img-3', sortOrder: 1 }
])
```

---

### `isSKUUnique(sku: string, excludeVariantId?: string): Promise<boolean>`

Check if SKU is globally unique.

**Parameters:**
- `sku` (string, required) - SKU to check
- `excludeVariantId` (string, optional) - Variant ID to exclude (for updates)

**Returns:** `true` if unique, `false` if exists

**Example:**
```javascript
// Check if SKU is available
const isUnique = await variantService.isSKUUnique('NIGHTY-DG-001')
if (!isUnique) {
  console.log('SKU already in use')
}

// Check when updating (exclude current variant)
const isUnique2 = await variantService.isSKUUnique(
  'NIGHTY-DG-001',
  'current-variant-uuid'
)
```

---

### `getVariantBySku(sku: string): Promise<Object | null>`

Find a variant by SKU.

**Parameters:**
- `sku` (string, required)

**Returns:** Variant object or null if not found

**Example:**
```javascript
const variant = await variantService.getVariantBySku('NIGHTY-DG-001')
if (variant) {
  console.log(`${variant.colorName} (${variant.sku})`)
} else {
  console.log('Variant not found')
}
```

---

### `updateVariantStock(variantId: string, quantity: number): Promise<void>`

Update variant stock quantity.

**Parameters:**
- `variantId` (string, required)
- `quantity` (number, required, >= 0)

**Example:**
```javascript
await variantService.updateVariantStock('variant-uuid', 100)
```

---

### `decreaseVariantStock(variantId: string, amount?: number): Promise<number>`

Decrease stock (typically for orders). Uses database function for atomicity.

**Parameters:**
- `variantId` (string, required)
- `amount` (number, optional, default 1)

**Returns:** New stock quantity

**Example:**
```javascript
// Decrease by 1
const newStock = await variantService.decreaseVariantStock('variant-uuid')

// Decrease by multiple
const newStock = await variantService.decreaseVariantStock('variant-uuid', 5)
```

---

## Validation Functions

### `validateHexCode(colorCode: string): Object`

Validate hex color code format.

```javascript
import { validateHexCode } from '@/utils/colorValidator'

const result = validateHexCode('#006400')
// { isValid: true }

const result2 = validateHexCode('006400') // Missing #
// { isValid: false, error: 'Invalid hex format...' }
```

---

### `validateVariant(variant: Object, options?: Object): Object`

Validate complete variant object.

```javascript
import { validateVariant } from '@/utils/colorValidator'

const result = validateVariant({
  colorName: 'Dark Green',
  colorCode: '#006400',
  sku: 'NIGHTY-DG-001',
  stockQuantity: 45,
  price: null
}, {
  checkDuplicates: existingVariants,
  checkSkuDuplicates: allSkus
})

// Returns:
// {
//   isValid: true,
//   errors: {} // or { fieldName: 'error message' }
// }
```

---

### `generateSuggestedSKU(productTitle: string, colorName: string, variantIndex: number): string`

Auto-generate suggested SKU.

```javascript
import { generateSuggestedSKU } from '@/utils/colorValidator'

const sku = generateSuggestedSKU('Nighty', 'Dark Green', 1)
// Returns: "NIG-DG-001"
```

---

## Hook Methods

### `useVariants(productId: string)`

Custom hook for variant state management.

```javascript
const {
  variants,           // Array of variants
  loading,            // Boolean, true while loading
  error,              // Error message or null
  fetchVariants,      // Refetch variants
  createVariant,      // Create new variant
  updateVariant,      // Update variant
  deleteVariant,      // Delete variant
  toggleVariantActive,// Toggle active status
  addVariantImages,   // Add images
  removeVariantImage, // Remove image
  reorderVariantImages, // Reorder images
  isSKUUnique,        // Check SKU uniqueness
  getVariantBySku,    // Get by SKU
  updateVariantStock  // Update stock
} = useVariants(productId)
```

**All methods handle state updates automatically.**

---

## Database Schema

### `product_variants` Table

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(7) NOT NULL, -- Must be #RRGGBB
  sku VARCHAR(50) NOT NULL UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  price DECIMAL(10, 2) NULL, -- NULL = use product price
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_hex_code CHECK (color_code ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT unique_color_per_product UNIQUE(product_id, color_code),
  CONSTRAINT unique_color_name_per_product UNIQUE(product_id, color_name)
);
```

### `variant_images` Table

```sql
CREATE TABLE variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  image_url VARCHAR NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_variant_image UNIQUE(variant_id, image_url)
);
```

---

## Error Handling

### Common Errors

**1. SKU Already Exists**
```javascript
try {
  await variantService.createVariant({ sku: 'USED-SKU-001', ... })
} catch (err) {
  // Error: "Duplicate key value violates unique constraint"
  // Solution: Use different SKU
}
```

**2. Invalid Hex Code**
```javascript
try {
  await variantService.createVariant({ colorCode: 'FF0000', ... })
} catch (err) {
  // Error: "violates check constraint \"valid_hex_code\""
  // Solution: Use format #RRGGBB
}
```

**3. Duplicate Color per Product**
```javascript
try {
  await variantService.createVariant({ 
    productId: 'p1',
    colorCode: '#006400',
    ... 
  })
  // Product already has this color code
} catch (err) {
  // Error: "violates unique constraint..."
  // Solution: Use different color code
}
```

---

## Performance Tips

1. **Batch Operations:** Use multiple operations efficiently:
   ```javascript
   // Good: Let hook handle state updates
   await createVariant(data1)
   await createVariant(data2)
   
   // Not recommended: Manual state management
   ```

2. **Cache Variants:** Hook automatically caches by productId

3. **Image Optimization:** Compress images before upload:
   ```javascript
   // Recommended image sizes:
   // - Product images: 800x800px or higher
   // - File size: < 200KB each
   ```

4. **Avoid N+1 Queries:** Use `getVariantsByProductId()` to load all variants at once

---

## Testing Examples

```javascript
// Test variant creation
async function testVariantCreation() {
  const variant = await variantService.createVariant({
    productId: 'test-product',
    colorName: 'Test Color',
    colorCode: '#FF0000',
    sku: 'TEST-TC-001',
    stockQuantity: 10,
    images: []
  })
  assert(variant.id, 'Variant created with ID')
  assert(variant.colorCode === '#FF0000')
}

// Test validation
function testColorValidation() {
  const valid = validateHexCode('#006400')
  assert(valid.isValid === true)
  
  const invalid = validateHexCode('FF0000')
  assert(invalid.isValid === false)
}

// Test in React component
function TestComponent() {
  const { variants, createVariant } = useVariants('product-id')
  
  const handleAdd = async () => {
    try {
      const newVariant = await createVariant({
        colorName: 'Blue',
        colorCode: '#0000FF',
        sku: 'PROD-BL-001',
        stockQuantity: 50
      })
      console.log('Created:', newVariant)
    } catch (err) {
      console.error('Failed:', err.message)
    }
  }
  
  return <button onClick={handleAdd}>Add Variant</button>
}
```

---

## Related Files

- **Service:** `src/services/variantService.js`
- **Validator:** `src/utils/colorValidator.js`
- **Hook:** `src/hooks/useVariants.js`
- **Components:** `src/components/products/VariantModal.jsx`, `VariantList.jsx`
- **Database:** `supabase/migrations/20260611000000_*.sql`
- **Docs:** `VARIANT_SYSTEM_MIGRATION.md`

---

**Last Updated:** 2026-06-11  
**Version:** 1.0.0
