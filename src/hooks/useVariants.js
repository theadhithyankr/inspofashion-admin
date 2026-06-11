/**
 * useVariants Hook
 * Manages variant state and operations for products
 */

import { useState, useEffect } from 'react'
import { variantService } from '../services/variantService'

export function useVariants(productId) {
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch all variants for a product
   */
  const fetchVariants = async () => {
    if (!productId) {
      setVariants([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await variantService.getVariantsByProductId(productId)
      setVariants(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching variants:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load variants on mount or when productId changes
   */
  useEffect(() => {
    fetchVariants()
  }, [productId])

  /**
   * Create a new variant
   */
  const createVariant = async (variantData) => {
    try {
      setError(null)
      const newVariant = await variantService.createVariant({
        ...variantData,
        productId,
      })
      setVariants(prev => [...prev, newVariant])
      return newVariant
    } catch (err) {
      setError(err.message)
      console.error('Error creating variant:', err)
      throw err
    }
  }

  /**
   * Update an existing variant
   */
  const updateVariant = async (variantId, updates) => {
    try {
      setError(null)
      const updated = await variantService.updateVariant(variantId, updates)
      setVariants(prev => prev.map(v => v.id === variantId ? updated : v))
      return updated
    } catch (err) {
      setError(err.message)
      console.error('Error updating variant:', err)
      throw err
    }
  }

  /**
   * Delete a variant
   */
  const deleteVariant = async (variantId) => {
    try {
      setError(null)
      await variantService.deleteVariant(variantId)
      setVariants(prev => prev.filter(v => v.id !== variantId))
    } catch (err) {
      setError(err.message)
      console.error('Error deleting variant:', err)
      throw err
    }
  }

  /**
   * Toggle variant active status
   */
  const toggleVariantActive = async (variantId, isActive) => {
    try {
      setError(null)
      const updated = await variantService.toggleVariantActive(variantId, isActive)
      setVariants(prev => prev.map(v => v.id === variantId ? updated : v))
      return updated
    } catch (err) {
      setError(err.message)
      console.error('Error toggling variant:', err)
      throw err
    }
  }

  /**
   * Add images to a variant
   */
  const addVariantImages = async (variantId, imageUrls) => {
    try {
      setError(null)
      const images = await variantService.addVariantImages(variantId, imageUrls)
      setVariants(prev =>
        prev.map(v =>
          v.id === variantId
            ? { ...v, images: [...(v.images || []), ...images] }
            : v
        )
      )
      return images
    } catch (err) {
      setError(err.message)
      console.error('Error adding variant images:', err)
      throw err
    }
  }

  /**
   * Remove image from variant
   */
  const removeVariantImage = async (variantId, imageId) => {
    try {
      setError(null)
      await variantService.removeVariantImage(imageId)
      setVariants(prev =>
        prev.map(v =>
          v.id === variantId
            ? { ...v, images: v.images.filter(img => img.id !== imageId) }
            : v
        )
      )
    } catch (err) {
      setError(err.message)
      console.error('Error removing variant image:', err)
      throw err
    }
  }

  /**
   * Reorder variant images
   */
  const reorderVariantImages = async (variantId, imageOrder) => {
    try {
      setError(null)
      await variantService.reorderVariantImages(variantId, imageOrder)
      setVariants(prev =>
        prev.map(v =>
          v.id === variantId
            ? {
                ...v,
                images: imageOrder
                  .map(item =>
                    v.images.find(img => img.id === item.id)
                  )
                  .filter(Boolean),
              }
            : v
        )
      )
    } catch (err) {
      setError(err.message)
      console.error('Error reordering variant images:', err)
      throw err
    }
  }

  /**
   * Check if SKU is unique
   */
  const isSKUUnique = async (sku, excludeVariantId = null) => {
    try {
      return await variantService.isSKUUnique(sku, excludeVariantId)
    } catch (err) {
      console.error('Error checking SKU uniqueness:', err)
      throw err
    }
  }

  /**
   * Get variant by SKU
   */
  const getVariantBySku = async (sku) => {
    try {
      return await variantService.getVariantBySku(sku)
    } catch (err) {
      console.error('Error fetching variant by SKU:', err)
      throw err
    }
  }

  /**
   * Update variant stock
   */
  const updateVariantStock = async (variantId, quantity) => {
    try {
      setError(null)
      await variantService.updateVariantStock(variantId, quantity)
      setVariants(prev =>
        prev.map(v =>
          v.id === variantId ? { ...v, stockQuantity: quantity } : v
        )
      )
    } catch (err) {
      setError(err.message)
      console.error('Error updating variant stock:', err)
      throw err
    }
  }

  return {
    variants,
    loading,
    error,
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    toggleVariantActive,
    addVariantImages,
    removeVariantImage,
    reorderVariantImages,
    isSKUUnique,
    getVariantBySku,
    updateVariantStock,
  }
}
