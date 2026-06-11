export function validateProduct(data) {
  const errors = {}

  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required'
  } else if (data.title.length > 100) {
    errors.title = 'Title must be less than 100 characters'
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters'
  }

  if (data.compare_at_price && parseFloat(data.compare_at_price) <= parseFloat(data.price || 0)) {
    errors.compare_at_price = 'Compare-at price must be higher than the sale price'
  }

  if (!data.price || isNaN(data.price) || parseFloat(data.price) <= 0) {
    errors.price = 'Price must be a positive number'
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.category = 'Category is required'
  }

  if (!data.sizes || data.sizes.length === 0) {
    errors.sizes = 'At least one size is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateVariantData(variant) {
  const errors = {}

  // Color name validation
  if (!variant.colorName || variant.colorName.trim().length === 0) {
    errors.colorName = 'Color name is required'
  } else if (variant.colorName.length < 2) {
    errors.colorName = 'Color name must be at least 2 characters'
  } else if (variant.colorName.length > 50) {
    errors.colorName = 'Color name must be less than 50 characters'
  }

  // Color code validation
  if (!variant.colorCode || variant.colorCode.trim().length === 0) {
    errors.colorCode = 'Color code is required'
  } else {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    if (!hexRegex.test(variant.colorCode.trim())) {
      errors.colorCode = 'Invalid hex format. Use #RRGGBB (e.g., #006400)'
    }
  }

  // SKU validation
  if (!variant.sku || variant.sku.trim().length === 0) {
    errors.sku = 'SKU is required'
  } else if (variant.sku.length < 5) {
    errors.sku = 'SKU must be at least 5 characters'
  } else if (variant.sku.length > 50) {
    errors.sku = 'SKU must be less than 50 characters'
  }

  // Stock quantity validation
  if (variant.stockQuantity === '' || variant.stockQuantity === null || variant.stockQuantity === undefined) {
    errors.stockQuantity = 'Stock quantity is required'
  } else {
    const num = parseInt(variant.stockQuantity, 10)
    if (isNaN(num)) {
      errors.stockQuantity = 'Stock must be a valid number'
    } else if (num < 0) {
      errors.stockQuantity = 'Stock cannot be negative'
    }
  }

  // Price validation (optional)
  if (variant.price !== '' && variant.price !== null && variant.price !== undefined) {
    const num = parseFloat(variant.price)
    if (isNaN(num)) {
      errors.price = 'Price must be a valid number'
    } else if (num < 0) {
      errors.price = 'Price cannot be negative'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateImageFile(file) {
  const errors = []

  if (!file) {
    errors.push('Image file is required')
    return { isValid: false, errors }
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    errors.push('Image must be JPEG, PNG, or WebP format')
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push('Image size must be less than 5MB')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
