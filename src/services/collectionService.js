import { supabase } from '../lib/supabase'

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
    // Generate slug from name if not provided
    const slug = collectionData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    
    const { data, error } = await supabase
      .from('collections')
      .insert([{ ...collectionData, slug }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  updateCollection: async (id, collectionData) => {
    const { data, error } = await supabase
      .from('collections')
      .update(collectionData)
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