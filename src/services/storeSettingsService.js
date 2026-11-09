import { supabase } from '../lib/supabase'

export const storeSettingsService = {
  getSettings: async (key) => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore "not found"
    return data?.value || null
  },

  updateSettings: async (key, value) => {
    const { data, error } = await supabase
      .from('store_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single()

    if (error) throw error
    return data.value
  },

  uploadImage: async (file, path) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${path}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
