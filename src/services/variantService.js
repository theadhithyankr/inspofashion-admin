/**
 * Variant Service
 * Handles CRUD operations for product variants
 * Manages variant data, images, and validations
 */

import { supabase } from '../lib/supabase'

export const variantService = {
  /**
   * Get all variants for a product
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Array of variant objects with images
   */
  async getVariantsByProductId(productId) {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        color_name,
        color_code,
        sku,
        stock_quantity,
        price,
        is_active,
        created_at,
        updated_at,
        variant_images (
          id,
          image_url,
          sort_order
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data.map(variant => ({
      id: variant.id,
      colorName: variant.color_name,
      colorCode: variant.color_code,
      sku: variant.sku,
      stockQuantity: variant.stock_quantity,
      price: variant.price,
      isActive: variant.is_active,
      images: (variant.variant_images || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => ({
          id: img.id,
          url: img.image_url,
          sortOrder: img.sort_order,
        })),
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    }))
  },

  /**
   * Get single variant
   * @param {string} variantId - Variant ID
   * @returns {Promise<Object>} Variant with images
   */
  async getVariant(variantId) {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        color_name,
        color_code,
        sku,
        stock_quantity,
        price,
        is_active,
        created_at,
        updated_at,
        variant_images (
          id,
          image_url,
          sort_order
        )
      `)
      .eq('id', variantId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      productId: data.product_id,
      colorName: data.color_name,
      colorCode: data.color_code,
      sku: data.sku,
      stockQuantity: data.stock_quantity,
      price: data.price,
      isActive: data.is_active,
      images: (data.variant_images || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => ({
          id: img.id,
          url: img.image_url,
          sortOrder: img.sort_order,
        })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Create a new variant
   * @param {Object} variantData - Variant data
   *   - productId: string (required)
   *   - colorName: string (required)
   *   - colorCode: string (required, #RRGGBB format)
   *   - sku: string (required, globally unique)
   *   - stockQuantity: number (required, >= 0)
   *   - price: number (optional, null = use product price)
   *   - isActive: boolean (optional, default true)
   *   - images: Array<{url: string}> (optional)
   * @returns {Promise<Object>} Created variant
   */
  async createVariant(variantData) {
    const {
      productId,
      colorName,
      colorCode,
      sku,
      stockQuantity,
      price,
      isActive = true,
      images = [],
    } = variantData

    // Insert variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert([
        {
          product_id: productId,
          color_name: colorName,
          color_code: colorCode,
          sku: sku,
          stock_quantity: stockQuantity,
          price: price || null,
          is_active: isActive,
        },
      ])
      .select()
      .single()

    if (variantError) throw variantError

    // Insert variant images if provided
    let createdImages = []
    if (images && images.length > 0) {
      const imageRecords = images.map((img, index) => ({
        variant_id: variant.id,
        image_url: img.url,
        sort_order: index,
      }))

      const { data: insertedImages, error: imagesError } = await supabase
        .from('variant_images')
        .insert(imageRecords)
        .select()

      if (imagesError) throw imagesError
      createdImages = insertedImages || []
    }

    return {
      id: variant.id,
      productId: variant.product_id,
      colorName: variant.color_name,
      colorCode: variant.color_code,
      sku: variant.sku,
      stockQuantity: variant.stock_quantity,
      price: variant.price,
      isActive: variant.is_active,
      images: createdImages.map(img => ({
        id: img.id,
        url: img.image_url,
        sortOrder: img.sort_order,
      })),
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    }
  },

  /**
   * Update an existing variant
   * @param {string} variantId - Variant ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated variant
   */
  async updateVariant(variantId, updates) {
    const updateData = {}

    // Map camelCase to snake_case
    if (updates.colorName !== undefined) updateData.color_name = updates.colorName
    if (updates.colorCode !== undefined) updateData.color_code = updates.colorCode
    if (updates.sku !== undefined) updateData.sku = updates.sku
    if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity
    if (updates.price !== undefined) updateData.price = updates.price === null ? null : updates.price
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .select()
      .single()

    if (error) throw error

    // Get images
    const { data: images, error: imagesError } = await supabase
      .from('variant_images')
      .select('*')
      .eq('variant_id', variantId)
      .order('sort_order', { ascending: true })

    if (imagesError) throw imagesError

    return {
      id: variant.id,
      productId: variant.product_id,
      colorName: variant.color_name,
      colorCode: variant.color_code,
      sku: variant.sku,
      stockQuantity: variant.stock_quantity,
      price: variant.price,
      isActive: variant.is_active,
      images: (images || []).map(img => ({
        id: img.id,
        url: img.image_url,
        sortOrder: img.sort_order,
      })),
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    }
  },

  /**
   * Delete a variant
   * @param {string} variantId - Variant ID
   */
  async deleteVariant(variantId) {
    // Cascade delete is handled by database constraint
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)

    if (error) throw error
  },

  /**
   * Toggle variant active status
   * @param {string} variantId - Variant ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} Updated variant
   */
  async toggleVariantActive(variantId, isActive) {
    return this.updateVariant(variantId, { isActive })
  },

  /**
   * Add images to variant
   * @param {string} variantId - Variant ID
   * @param {Array<string>} imageUrls - Array of image URLs
   * @returns {Promise<Array>} Created image records
   */
  async addVariantImages(variantId, imageUrls) {
    // Get current max sort order
    const { data: existingImages } = await supabase
      .from('variant_images')
      .select('sort_order')
      .eq('variant_id', variantId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSort = existingImages?.length > 0 ? existingImages[0].sort_order : -1

    // Insert new images with sort order
    const imageRecords = imageUrls.map((url, index) => ({
      variant_id: variantId,
      image_url: url,
      sort_order: maxSort + index + 1,
    }))

    const { data, error } = await supabase
      .from('variant_images')
      .insert(imageRecords)
      .select()

    if (error) throw error

    return (data || []).map(img => ({
      id: img.id,
      url: img.image_url,
      sortOrder: img.sort_order,
    }))
  },

  /**
   * Remove image from variant
   * @param {string} imageId - Variant image ID
   */
  async removeVariantImage(imageId) {
    const { error } = await supabase
      .from('variant_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
  },

  /**
   * Reorder variant images
   * @param {string} variantId - Variant ID
   * @param {Array<{id, sortOrder}>} imageOrder - Image order data
   */
  async reorderVariantImages(variantId, imageOrder) {
    // Update each image's sort order
    const updates = imageOrder.map(item =>
      supabase
        .from('variant_images')
        .update({ sort_order: item.sortOrder })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(`Failed to reorder images: ${errors[0].error.message}`)
    }
  },

  /**
   * Check if SKU is globally unique
   * @param {string} sku - SKU to check
   * @param {string} excludeVariantId - Variant ID to exclude (for updates)
   * @returns {Promise<boolean>} True if unique, false if exists
   */
  async isSKUUnique(sku, excludeVariantId = null) {
    let query = supabase
      .from('product_variants')
      .select('id', { count: 'exact' })
      .ilike('sku', sku)

    if (excludeVariantId) {
      query = query.neq('id', excludeVariantId)
    }

    const { count, error } = await query

    if (error) throw error
    return count === 0
  },

  /**
   * Get variant by SKU
   * @param {string} sku - SKU to search
   * @returns {Promise<Object|null>} Variant or null if not found
   */
  async getVariantBySku(sku) {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        color_name,
        color_code,
        sku,
        stock_quantity,
        price,
        is_active,
        variant_images (
          id,
          image_url,
          sort_order
        )
      `)
      .ilike('sku', sku)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found
      return null
    }

    if (error) throw error

    return {
      id: data.id,
      productId: data.product_id,
      colorName: data.color_name,
      colorCode: data.color_code,
      sku: data.sku,
      stockQuantity: data.stock_quantity,
      price: data.price,
      isActive: data.is_active,
      images: (data.variant_images || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => ({
          id: img.id,
          url: img.image_url,
          sortOrder: img.sort_order,
        })),
    }
  },

  /**
   * Update variant stock quantity
   * @param {string} variantId - Variant ID
   * @param {number} quantity - New quantity
   */
  async updateVariantStock(variantId, quantity) {
    const { error } = await supabase
      .from('product_variants')
      .update({ stock_quantity: quantity })
      .eq('id', variantId)

    if (error) throw error
  },

  /**
   * Decrease variant stock (for orders)
   * @param {string} variantId - Variant ID
   * @param {number} amount - Amount to decrease (default 1)
   */
  async decreaseVariantStock(variantId, amount = 1) {
    const { data, error } = await supabase.rpc('decrease_variant_stock', {
      v_variant_id: variantId,
      v_amount: amount,
    })

    if (error) throw error
    return data
  },
}
