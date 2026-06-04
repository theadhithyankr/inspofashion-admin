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
