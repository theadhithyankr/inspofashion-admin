import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { collectionService } from '../../services/collectionService'

export function CollectionModal({ isOpen, onClose, mode, collection, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && collection) {
        setFormData({
          name: collection.name || '',
          slug: collection.slug || '',
          description: collection.description || '',
          image_url: collection.image_url || '',
          is_active: collection.is_active ?? true
        })
        setImagePreview(collection.image_url || '')
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          image_url: '',
          is_active: true
        })
        setImagePreview('')
      }
      setImageFile(null)
      setError('')
    }
  }, [isOpen, mode, collection])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let finalImageUrl = formData.image_url

      if (imageFile) {
        finalImageUrl = await collectionService.uploadImage(imageFile)
      }

      const dataToSubmit = {
        ...formData,
        image_url: finalImageUrl,
      }

      if (mode === 'edit') {
        await onSuccess(collection.id, dataToSubmit)
      } else {
        await onSuccess(dataToSubmit)
      }

      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred while saving the collection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={!loading ? onClose : undefined}
      title={mode === 'create' ? 'Add New Collection' : 'Edit Collection'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-200 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Collection Image</label>
          <div className="flex items-start space-x-4">
            <div className="relative h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                      setFormData({ ...formData, image_url: '' })
                    }}
                    className="absolute top-1 right-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  </button>
                </>
              ) : (
                <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="collection-image" className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-gray-900">
                  Select Image
                </span>
                <input
                  id="collection-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">JPG, PNG, or WEBP. Max 2MB.</p>
            </div>
          </div>
        </div>

        <Input
          label="Collection Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Summer Essentials"
        />

        {mode === 'edit' && (
          <Input
            label="URL Slug (Optional)"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g. summer-essentials"
            helperText="Leave blank to auto-generate from name"
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2"
            placeholder="Describe this collection..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (mode === 'create' ? 'Add Collection' : 'Save Changes')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}