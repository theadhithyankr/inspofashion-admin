import { useState, useEffect, useRef } from 'react'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { useCollections } from '../../hooks/useCollections'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import { Image as ImageIcon, Upload } from 'lucide-react'

export function HeroImageSettings() {
  const { settings, loading, saving, error, saveSettings, uploadImage } = useStoreSettings('hero_section')
  const { collections } = useCollections()
  const [formData, setFormData] = useState({
    title: '', subtitle: '', image_url: '', button_men: '', button_women: '', button_men_url: '', button_women_url: ''
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (settings) {
      setFormData({
        title: settings.title || '',
        subtitle: settings.subtitle || '',
        image_url: settings.image_url || '',
        button_men: settings.button_men || '',
        button_women: settings.button_women || '',
        button_men_url: settings.button_men_url || '',
        button_women_url: settings.button_women_url || ''
      })
    }
  }, [settings])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file')
      return
    }

    try {
      setUploadingImage(true)
      setUploadError(null)
      const url = await uploadImage(file, 'store-assets')
      setFormData(prev => ({ ...prev, image_url: url }))
    } catch (err) {
      console.error('Error uploading image:', err)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await saveSettings(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Hero Section Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Customize the main landing section of your storefront.</p>
      </div>

      {(error || uploadError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error || uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Text Content</h3>
            <Input
              label="Headline Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g. Ready. Set. Take your time."
            />
            <Input
              label="Subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              required
              placeholder="e.g. The Dasher Collection"
            />
            <div className="space-y-2">
              <Input
                label="Left Button Text"
                value={formData.button_men}
                onChange={(e) => setFormData({ ...formData, button_men: e.target.value })}
                placeholder="e.g. Shop Men"
              />
              {formData.button_men && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Left Button Destination
                  </label>
                  <select
                    value={formData.button_men_url}
                    onChange={(e) => setFormData({ ...formData, button_men_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="" disabled>Select destination...</option>
                    <option value="/">Home Page</option>
                    <option value="/search">All Products / Search</option>
                    {collections && collections.length > 0 && (
                      <optgroup label="Collections">
                        {collections.map(col => (
                          <option key={col.id} value={`/collections/${encodeURIComponent(col.name)}`}>
                            {col.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {formData.button_men_url && !['/', '/search'].includes(formData.button_men_url) && !formData.button_men_url.startsWith('/collections/') && (
                      <option value={formData.button_men_url}>{formData.button_men_url} (Custom)</option>
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input
                label="Right Button Text"
                value={formData.button_women}
                onChange={(e) => setFormData({ ...formData, button_women: e.target.value })}
                placeholder="e.g. Shop Women"
              />
              {formData.button_women && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Right Button Destination
                  </label>
                  <select
                    value={formData.button_women_url}
                    onChange={(e) => setFormData({ ...formData, button_women_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="" disabled>Select destination...</option>
                    <option value="/">Home Page</option>
                    <option value="/search">All Products / Search</option>
                    {collections && collections.length > 0 && (
                      <optgroup label="Collections">
                        {collections.map(col => (
                          <option key={col.id} value={`/collections/${encodeURIComponent(col.name)}`}>
                            {col.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {formData.button_women_url && !['/', '/search'].includes(formData.button_women_url) && !formData.button_women_url.startsWith('/collections/') && (
                      <option value={formData.button_women_url}>{formData.button_women_url} (Custom)</option>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Background Image</h3>
            <div className="mt-2 flex flex-col gap-4">
              {formData.image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={formData.image_url}
                    alt="Hero preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2 text-gray-400 dark:text-gray-500" />
                  <p>No image selected</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or paste an image URL..."
                  className="flex-1 rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-2 px-3 border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {uploadingImage && (
                <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <Spinner size="sm" className="mr-2" /> Uploading image...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800">
          <Button type="submit" variant="primary" disabled={saving || uploadingImage}>
            {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : success ? 'Saved!' : 'Save Hero Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
