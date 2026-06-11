import { useState, useEffect } from 'react'
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { productService } from '../../services/productService'
import { variantService } from '../../services/variantService'
import { validateVariantData } from '../../utils/validators'
import { validateHexCode, generateSuggestedSKU, hexToRgb, getColorBrightness } from '../../utils/colorValidator'

export function VariantModal({ isOpen, onClose, mode = 'create', variant = null, productTitle = '', onSuccess }) {
  const [formData, setFormData] = useState({
    colorName: '',
    colorCode: '#000000',
    sku: '',
    stockQuantity: '0',
    price: '',
  })

  const [images, setImages] = useState([])
  const [imagesToRemove, setImagesToRemove] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [previewColor, setPreviewColor] = useState('#000000')

  // Load variant data if editing
  useEffect(() => {
    if (!isOpen) {
      resetForm()
      return
    }

    if (mode === 'edit' && variant) {
      setFormData({
        colorName: variant.colorName || '',
        colorCode: variant.colorCode || '#000000',
        sku: variant.sku || '',
        stockQuantity: variant.stockQuantity?.toString() || '0',
        price: variant.price ? variant.price.toString() : '',
      })
      setPreviewColor(variant.colorCode || '#000000')
      setImages(variant.images || [])
    } else {
      resetForm()
    }
  }, [mode, variant, isOpen])

  const resetForm = () => {
    setFormData({
      colorName: '',
      colorCode: '#000000',
      sku: '',
      stockQuantity: '0',
      price: '',
    })
    setImages([])
    setImagesToRemove([])
    setErrors({})
    setUploadProgress(null)
    setPreviewColor('#000000')
    setColorPickerOpen(false)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleColorCodeChange = (value) => {
    const trimmed = value.trim()
    handleChange('colorCode', trimmed)
    
    // Validate and update preview
    const validation = validateHexCode(trimmed)
    if (validation.isValid) {
      setPreviewColor(trimmed)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [
          ...prev,
          {
            id: `new-${Date.now()}-${Math.random()}`,
            url: reader.result,
            isNew: true,
            file,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index) => {
    const img = images[index]
    if (img.url && !img.isNew) {
      setImagesToRemove(prev => [...prev, img.url])
    }
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerateSKU = () => {
    const suggested = generateSuggestedSKU(productTitle, formData.colorName, 1)
    handleChange('sku', suggested)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form data
    const validation = validateVariantData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Require at least one image
    if (images.length === 0) {
      setErrors(prev => ({ ...prev, images: 'At least one image is required' }))
      return
    }

    // Check SKU uniqueness (if new or changed)
    if (mode === 'create' || (mode === 'edit' && formData.sku !== variant.sku)) {
      try {
        const isUnique = await variantService.isSKUUnique(formData.sku, variant?.id)
        if (!isUnique) {
          setErrors(prev => ({ ...prev, sku: 'This SKU is already in use' }))
          return
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, submit: 'Failed to validate SKU uniqueness' }))
        return
      }
    }

    setLoading(true)
    setErrors({})

    try {
      // Upload new images
      const imageUrlById = {}
      const filesToUpload = images.filter(img => img.isNew)

      if (filesToUpload.length > 0) {
        setUploadProgress(`Uploading images (0/${filesToUpload.length})...`)
      }

      for (let i = 0; i < filesToUpload.length; i++) {
        const img = filesToUpload[i]
        const url = await productService.uploadImage(img.file)
        imageUrlById[img.id] = url
        setUploadProgress(`Uploading images (${i + 1}/${filesToUpload.length})...`)
      }

      // Map images to URLs (old + new)
      const finalImages = images.map(img => ({
        url: imageUrlById[img.id] || img.url,
      }))

      if (mode === 'create') {
        await onSuccess({
          colorName: formData.colorName.trim(),
          colorCode: formData.colorCode.trim(),
          sku: formData.sku.trim(),
          stockQuantity: parseInt(formData.stockQuantity, 10),
          price: formData.price ? parseFloat(formData.price) : null,
          images: finalImages,
        })
      } else {
        // For edit mode, update existing variant
        const variantId = variant.id
        
        // Update variant data
        await variantService.updateVariant(variantId, {
          colorName: formData.colorName.trim(),
          colorCode: formData.colorCode.trim(),
          sku: formData.sku.trim(),
          stockQuantity: parseInt(formData.stockQuantity, 10),
          price: formData.price ? parseFloat(formData.price) : null,
        })

        // Remove deleted images
        for (const imageUrl of imagesToRemove) {
          const imgRecord = variant.images?.find(img => img.url === imageUrl)
          if (imgRecord) {
            await variantService.removeVariantImage(imgRecord.id)
          }
        }

        // Add new images
        const newImageUrls = finalImages
          .filter(img => !variant.images?.some(vi => vi.url === img.url))
          .map(img => img.url)

        if (newImageUrls.length > 0) {
          await variantService.addVariantImages(variantId, newImageUrls)
        }

        await onSuccess()
      }

      onClose()
      resetForm()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save variant' })
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  const brightness = getColorBrightness(previewColor)
  const textColor = brightness === 'light' ? '#000000' : '#FFFFFF'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Add Color Variant' : 'Edit Color Variant'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Color Preview */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm"
            style={{ backgroundColor: previewColor }}
            title={`${previewColor} - ${getColorBrightness(previewColor)} color`}
          >
            <span style={{ color: textColor }} className="text-xs font-semibold">
              {previewColor}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Color Preview</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Updates in real-time</p>
          </div>
        </div>

        {/* Color Name */}
        <Input
          label="Color Name"
          placeholder="e.g., Dark Green"
          value={formData.colorName}
          onChange={(e) => handleChange('colorName', e.target.value)}
          error={errors.colorName}
          required
          disabled={loading}
          helperText="Must be 2-50 characters. Example: Dark Green, Maroon, Navy"
        />

        {/* Color Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Color Code (Hex) <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="#000000"
              value={formData.colorCode}
              onChange={(e) => handleColorCodeChange(e.target.value)}
              error={errors.colorCode}
              required
              disabled={loading}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
              title="Pick color"
            >
              <div
                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: previewColor }}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Format: #RRGGBB. Example: #006400 (Dark Green), #800000 (Maroon)
          </p>
          {errors.colorCode && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.colorCode}</p>}

          {/* Color Picker */}
          {colorPickerOpen && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="color"
                value={previewColor}
                onChange={(e) => handleColorCodeChange(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., NIGHTY-DG-001"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              error={errors.sku}
              required
              disabled={loading}
              className="flex-1"
              helperText="Stock Keeping Unit - must be globally unique"
            />
            <button
              type="button"
              onClick={handleGenerateSKU}
              className="px-4 py-2 border border-primary-300 dark:border-primary-700 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-sm font-medium"
              disabled={loading || !formData.colorName}
              title="Auto-generate SKU from product name and color"
            >
              Generate
            </button>
          </div>
          {errors.sku && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.sku}</p>}
        </div>

        {/* Stock Quantity */}
        <Input
          label="Stock Quantity"
          type="number"
          min="0"
          placeholder="0"
          value={formData.stockQuantity}
          onChange={(e) => handleChange('stockQuantity', e.target.value)}
          error={errors.stockQuantity}
          required
          disabled={loading}
          helperText={formData.stockQuantity === '0' ? '⚠️ Product will show as SOLD OUT' : ''}
        />

        {/* Price (Optional Override) */}
        <Input
          label="Price Override (Optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="Leave empty to use product price"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          error={errors.price}
          disabled={loading}
          helperText="Only set if this variant has a different price than the product base price"
        />

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Variant Images <span className="text-red-500">*</span>
          </label>

          <div className="flex flex-wrap gap-3 mb-4">
            {images.map((img, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={img.url}
                  alt={`Variant ${index}`}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                />
                {img.isNew && (
                  <span className="absolute top-0 left-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-lg">
                    NEW
                  </span>
                )}
                {!loading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Upload Button */}
            <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-center">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Upload</span>
              </div>
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

          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WebP (max 5MB each)</p>
          {errors.images && <p className="mt-1 text-sm text-red-600 dark:text-red-200">{errors.images}</p>}
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{uploadProgress}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {mode === 'create' ? 'Add Variant' : 'Update Variant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
