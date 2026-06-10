export function normalizeColorImageMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([color]) => typeof color === 'string' && color.trim())
      .map(([color, urls]) => [
        color,
        Array.isArray(urls)
          ? [...new Set(urls.filter((url) => typeof url === 'string' && url.trim()))]
          : [],
      ])
  )
}

export function getProductImagesForColor(product, color) {
  const colorImageMap = normalizeColorImageMap(product?.color_image_map)
  const variantImages = color ? colorImageMap[color] : null

  if (variantImages?.length) {
    return variantImages
  }

  if (Array.isArray(product?.images) && product.images.length) {
    return product.images
  }

  return product?.image_url ? [product.image_url] : []
}
