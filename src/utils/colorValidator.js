/**
 * Color validation utilities for product variants
 * Ensures color names and codes meet requirements
 */

/**
 * Validates hex color code format
 * @param {string} colorCode - The color code to validate (e.g., "#006400")
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateHexCode(colorCode) {
  if (!colorCode) {
    return { isValid: false, error: 'Color code is required' }
  }

  const trimmed = colorCode.trim()

  // Check format: #RRGGBB
  const hexRegex = /^#[0-9A-Fa-f]{6}$/
  if (!hexRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid hex format. Use #RRGGBB (e.g., #006400)',
    }
  }

  return { isValid: true }
}

/**
 * Validates color name
 * @param {string} colorName - The color name to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateColorName(colorName) {
  if (!colorName) {
    return { isValid: false, error: 'Color name is required' }
  }

  const trimmed = colorName.trim()

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Color name must be at least 2 characters' }
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Color name must be less than 50 characters' }
  }

  // Allow letters, numbers, spaces, and hyphens
  const nameRegex = /^[A-Za-z0-9\s\-]+$/
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Color name can only contain letters, numbers, spaces, and hyphens',
    }
  }

  return { isValid: true }
}

/**
 * Validates SKU format
 * @param {string} sku - The SKU to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateSKU(sku) {
  if (!sku) {
    return { isValid: false, error: 'SKU is required' }
  }

  const trimmed = sku.trim()

  if (trimmed.length < 5) {
    return { isValid: false, error: 'SKU must be at least 5 characters' }
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'SKU must be less than 50 characters' }
  }

  // Allow uppercase letters, numbers, and hyphens
  const skuRegex = /^[A-Z0-9\-]+$/
  if (!skuRegex.test(trimmed.toUpperCase())) {
    return {
      isValid: false,
      error: 'SKU must contain only letters, numbers, and hyphens',
    }
  }

  return { isValid: true }
}

/**
 * Validates stock quantity
 * @param {number|string} quantity - The quantity to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateStockQuantity(quantity) {
  if (quantity === '' || quantity === null || quantity === undefined) {
    return { isValid: false, error: 'Stock quantity is required' }
  }

  const num = parseInt(quantity, 10)

  if (isNaN(num)) {
    return { isValid: false, error: 'Stock must be a valid number' }
  }

  if (num < 0) {
    return { isValid: false, error: 'Stock cannot be negative' }
  }

  return { isValid: true }
}

/**
 * Validates variant price (optional override)
 * @param {number|string|null} price - The price to validate (null is allowed)
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateVariantPrice(price) {
  // null/empty is allowed (means use product price)
  if (price === '' || price === null || price === undefined) {
    return { isValid: true }
  }

  const num = parseFloat(price)

  if (isNaN(num)) {
    return { isValid: false, error: 'Price must be a valid number' }
  }

  if (num < 0) {
    return { isValid: false, error: 'Price cannot be negative' }
  }

  return { isValid: true }
}

/**
 * Validates complete variant object
 * @param {Object} variant - The variant to validate
 * @param {Object} options - Validation options
 *   - checkDuplicates?: Array of existing variants to check against
 *   - checkSkuDuplicates?: Array of existing SKUs globally
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateVariant(variant, options = {}) {
  const errors = {}

  // Validate color name
  const colorNameValidation = validateColorName(variant.colorName)
  if (!colorNameValidation.isValid) {
    errors.colorName = colorNameValidation.error
  }

  // Validate color code
  const colorCodeValidation = validateHexCode(variant.colorCode)
  if (!colorCodeValidation.isValid) {
    errors.colorCode = colorCodeValidation.error
  }

  // Validate SKU
  const skuValidation = validateSKU(variant.sku)
  if (!skuValidation.isValid) {
    errors.sku = skuValidation.error
  }

  // Validate stock quantity
  const stockValidation = validateStockQuantity(variant.stockQuantity)
  if (!stockValidation.isValid) {
    errors.stockQuantity = stockValidation.error
  }

  // Validate optional price
  if (variant.price !== undefined && variant.price !== null) {
    const priceValidation = validateVariantPrice(variant.price)
    if (!priceValidation.isValid) {
      errors.price = priceValidation.error
    }
  }

  // Check for duplicate color names in same product
  if (options.checkDuplicates && Array.isArray(options.checkDuplicates)) {
    const duplicateName = options.checkDuplicates.find(
      v => v.id !== variant.id &&
      v.colorName.toLowerCase() === variant.colorName.toLowerCase()
    )
    if (duplicateName) {
      errors.colorName = `Color "${variant.colorName}" already exists for this product`
    }

    const duplicateCode = options.checkDuplicates.find(
      v => v.id !== variant.id &&
      v.colorCode.toLowerCase() === variant.colorCode.toLowerCase()
    )
    if (duplicateCode) {
      errors.colorCode = `Color code ${variant.colorCode} already exists for this product`
    }
  }

  // Check for global SKU duplicates (from backend typically)
  if (options.checkSkuDuplicates && Array.isArray(options.checkSkuDuplicates)) {
    const duplicateSku = options.checkSkuDuplicates.find(
      sku => sku.toLowerCase() === variant.sku.toLowerCase()
    )
    if (duplicateSku) {
      errors.sku = `SKU already in use: ${variant.sku}`
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Generates a suggested SKU from product name and color
 * @param {string} productTitle - Product title
 * @param {string} colorName - Color name
 * @param {number} variantIndex - Index of this variant (1-based)
 * @returns {string} Generated SKU
 */
export function generateSuggestedSKU(productTitle, colorName, variantIndex = 1) {
  // Extract first 3 letters of product (uppercase, alphanumeric only)
  const productCode = productTitle
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')

  // Extract first 2 letters of color (uppercase, alphanumeric only)
  const colorCode = colorName
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 2)
    .toUpperCase()
    .padEnd(2, 'X')

  // Format: PRODUCT-COLOR-INDEX
  return `${productCode}-${colorCode}-${String(variantIndex).padStart(3, '0')}`
}

/**
 * Converts hex color code to RGB for display
 * @param {string} hexCode - Hex color code (e.g., "#006400")
 * @returns {Object} { r, g, b } or null if invalid
 */
export function hexToRgb(hexCode) {
  const validation = validateHexCode(hexCode)
  if (!validation.isValid) return null

  const hex = hexCode.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return { r, g, b }
}

/**
 * Checks if a color is light or dark
 * @param {string} hexCode - Hex color code
 * @returns {string} 'light' or 'dark'
 */
export function getColorBrightness(hexCode) {
  const rgb = hexToRgb(hexCode)
  if (!rgb) return 'dark'

  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255

  return luminance > 0.5 ? 'light' : 'dark'
}

/**
 * Gets contrasting text color for given background
 * @param {string} hexCode - Hex color code
 * @returns {string} '#FFFFFF' or '#000000'
 */
export function getContrastColor(hexCode) {
  const brightness = getColorBrightness(hexCode)
  return brightness === 'light' ? '#000000' : '#FFFFFF'
}
