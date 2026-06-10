import { supabase } from '../lib/supabase'
import { normalizeColorImageMap } from '../utils/productVariants'

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function generateUniqueSlug(title, excludeId = null) {
  let baseSlug = slugify(title)
  let slug = baseSlug
  let counter = 1

  // Check if slug already exists
  while (true) {
    let query = supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('slug', slug)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { count, error } = await query

    if (error) throw error
    
    if (count === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

function normalizeProductData(productData) {
  return {
    ...productData,
    color_image_map: normalizeColorImageMap(productData.color_image_map),
  }
}

export const productService = {
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createProduct(productData) {
    const slug = await generateUniqueSlug(productData.title)
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...normalizeProductData(productData), slug }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProduct(id, updates) {
    const slug = await generateUniqueSlug(updates.title, id)
    const { data, error } = await supabase
      .from('products')
      .update({ ...normalizeProductData(updates), slug })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleActive(id, isActive) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  },

  async deleteImage(imageUrl) {
    try {
      const urlParts = imageUrl.split('/product-images/')
      if (urlParts.length < 2) return

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  },
}
