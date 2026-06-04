import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { productService } from '../../services/productService'
import { validateProduct, validateImageFile } from '../../utils/validators'
import { useCollections } from '../../hooks/useCollections'

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export function ProductModal({ isOpen, onClose, mode = 'create', product = null, onSuccess }) {
  const { collections } = useCollections()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    sizes: [],
    material: '',
    fit_notes: '',
    care_instructions: '',
    is_featured: false,
    tags: '',
  })
  
  // Track images: array of { file?: File, preview?: string, existingUrl?: string }
  const [images, setImages] = useState([])
  const [imagesToRemove, setImagesToRemove] = useState([]) // Array of urls to delete from storage

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price || '',
        compare_at_price: product.compare_at_price || '',
        category: product.category || '',
        sizes: product.sizes || [],
        material: product.material || '',
        fit_notes: product.fit_notes || '',
        care_instructions: product.care_instructions || '',
        is_featured: Boolean(product.is_featured),
        tags: (product.tags || []).join(', '),
      })
      // Load existing images
      const initialImages = [];
      if (product.images && product.images.length > 0) {
        product.images.forEach(url => initialImages.push({ existingUrl: url }))
      } else if (product.image_url) {
        initialImages.push({ existingUrl: product.image_url }) // Fallback for old data
      }
      setImages(initialImages)
      setImagesToRemove([])
    } else {
      resetForm()
    }
  }, [mode, product, isOpen])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      category: '',
      sizes: [],
      material: '',
      fit_notes: '',
      care_instructions: '',
      is_featured: false,
      tags: '',
    })
    setImages([])
    setImagesToRemove([])
    setErrors({})
    setUploadProgress(null)
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Simple validation
    const validFiles = files.filter(file => {
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        setErrors((prev) => ({ ...prev, image: validation.errors.join(', ') }))
        return false
      }
      return true
    })

    setErrors((prev) => ({ ...prev, image: null }))

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [...prev, { file, preview: reader.result }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index) => {
    const img = images[index];
    if (img.existingUrl) {
      setImagesToRemove(prev => [...prev, img.existingUrl])
    }
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
    if (errors.sizes) {
      setErrors((prev) => ({ ...prev, sizes: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateProduct(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Check if we have an image (new file or existing)
    if (images.length === 0) {
      setErrors((prev) => ({ ...prev, image: 'At least one image is required' }))
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const finalImagesUrls = [];
      let currentUploadNum = 1;
      const filesToUpload = images.filter(img => img.file);

      setUploadProgress(filesToUpload.length > 0 ? `Uploading images (0/${filesToUpload.length})...` : (mode === 'create' ? 'Creating product...' : 'Updating product...'));

      for (const img of images) {
        if (img.existingUrl) {
          finalImagesUrls.push(img.existingUrl);
        } else if (img.file) {
          const url = await productService.uploadImage(img.file);
          finalImagesUrls.push(url);
          setUploadProgress(currentUploadNum < filesToUpload.length ? `Uploading images (${currentUploadNum++}/${filesToUpload.length})...` : (mode === 'create' ? 'Creating product...' : 'Updating product...'));
        }
      }

      // Delete removed images in the background
      imagesToRemove.forEach(url => {
        productService.deleteImage(url).catch(e => console.error("Failed to delete unused image", url, e))
      });

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        category: formData.category.trim(),
        sizes: formData.sizes,
        material: formData.material.trim(),
        fit_notes: formData.fit_notes.trim(),
        care_instructions: formData.care_instructions.trim(),
        is_featured: formData.is_featured,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        images: finalImagesUrls,
        image_url: finalImagesUrls[0], // primary image
      }

      if (mode === 'create') {
        await onSuccess(productData)
      } else {
        await onSuccess(product.id, productData)
      }

      onClose()
      resetForm()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save product. Please try again.' })
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      resetForm()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={mode === 'create' ? 'Add New Product' : 'Edit Product'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Product Images <span className="text-red-500">*</span>
          </label>

          <div className="flex flex-wrap gap-4 mb-4">
            {images.map((img, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={img.preview || img.existingUrl}
                  alt={`Preview ${index}`}
                  className={`h-24 w-24 rounded-lg object-cover ${img.file ? 'border-2 border-green-500' : ''}`}
                />
                {img.file && (
                  <span className="absolute top-0 left-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-lg">
                    NEW
                  </span>
                )}
                {!loading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Upload Box */}
            <div className="flex-shrink-0">
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-1">Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WebP (max 5MB each). First image will be the primary one.</span>

          {errors.image && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.image}</p>}
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., Red Cotton T-Shirt"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
          required
          disabled={loading}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Description
          </label>
          <textarea
            placeholder="Describe the product..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            disabled={loading}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Price */}
          <Input
            label="Price (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="999"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            error={errors.price}
            required
            disabled={loading}
          />

          <Input
            label="Compare-at Price (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Optional"
            value={formData.compare_at_price}
            onChange={(e) => handleChange('compare_at_price', e.target.value)}
            error={errors.compare_at_price}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              required
              disabled={loading}
            >
              <option value="">Select category...</option>
              {collections.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.category}</p>}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Available Sizes <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.sizes.includes(size)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {size}
              </button>
            ))}
          </div>
          {errors.sizes && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.sizes}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Material"
            placeholder="e.g., Cotton linen blend"
            value={formData.material}
            onChange={(e) => handleChange('material', e.target.value)}
            disabled={loading}
          />

          <Input
            label="Tags"
            placeholder="Comma separated: summer, relaxed fit"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Fit Notes
            </label>
            <textarea
              value={formData.fit_notes}
              onChange={(e) => handleChange('fit_notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-700"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Care Instructions
            </label>
            <textarea
              value={formData.care_instructions}
              onChange={(e) => handleChange('care_instructions', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-700"
              disabled={loading}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <input
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => handleChange('is_featured', e.target.checked)}
            disabled={loading}
            className="h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Feature on storefront</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Featured products appear first in the premium storefront edit.</span>
          </span>
        </label>

        {/* Progress indicator */}
        {uploadProgress && (
          <div className="bg-primary-50 border border-primary-200 text-primary-700 dark:bg-gray-800 dark:border-gray-700 dark:text-primary-200 px-4 py-3 rounded-lg flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-3" />
            {uploadProgress}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {mode === 'create' ? 'Add Product' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
