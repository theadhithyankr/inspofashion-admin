import { supabase } from '../lib/supabase'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

async function generateUniqueCollectionSlug(name, excludeId = null) {
  const base = slugify(name)
  let slug = base
  let counter = 1

  while (true) {
    let query = supabase
      .from('collections')
      .select('id', { count: 'exact' })
      .eq('slug', slug)

    if (excludeId) query = query.neq('id', excludeId)

    const { count, error } = await query
    if (error) throw error
    if (count === 0) return slug

    slug = `${base}-${counter}`
    counter++
  }
}

export const collectionService = {
  getCollections: async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  createCollection: async (collectionData) => {
    const slug = await generateUniqueCollectionSlug(collectionData.name)

    const { data, error } = await supabase
      .from('collections')
      .insert([{ ...collectionData, slug }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  updateCollection: async (id, collectionData) => {
    // Regenerate slug if name changed, ensuring uniqueness excluding this record
    const updates = { ...collectionData }
    if (collectionData.name) {
      updates.slug = await generateUniqueCollectionSlug(collectionData.name, id)
    }

    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  deleteCollection: async (id) => {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  toggleActive: async (id, currentStatus) => {
    const { data, error } = await supabase
      .from('collections')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
  
  uploadImage: async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `collections/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images') // Re-using product-images bucket for simplicity
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  }
}