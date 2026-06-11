import { useState, useEffect, useRef } from 'react'
import { Check, Upload, X, Search } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { productService } from '../../services/productService'
import { validateProduct, validateImageFile } from '../../utils/validators'
import { normalizeColorImageMap } from '../../utils/productVariants'
import { useCollections } from '../../hooks/useCollections'

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const DEFAULT_COLORS = ['White', 'Black', 'Gray', 'Navy', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Beige', 'Brown', 'Olive']

// Colors in Supabase may be stored as {name, hex} objects — extract just the name string
function normalizeColors(colors) {
  if (!Array.isArray(colors)) return []
  return colors
    .map(c => {
      if (c && typeof c === 'object' && c.name) {
        return String(c.name).trim()
      }
      return String(c).trim()
    })
    .filter(Boolean)
}

function createImageId() {
  return globalThis.crypto?.randomUUID?.() || `image-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getImageId(image) {
  return image.id || image.existingUrl
}

export function ProductModal({ isOpen, onClose, mode = 'create', product = null, onSuccess }) {
  const { collections } = useCollections()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    sizes: [],
    colors: [],
    quantity: '',
    material: '',
    fit_notes: '',
    care_instructions: '',
    is_featured: false,
    tags: '',
  })
  
  // Track images before uploads so color mappings can point to stable local IDs.
  const [images, setImages] = useState([])
  const [colorImageMap, setColorImageMap] = useState({})
  const [imagesToRemove, setImagesToRemove] = useState([]) // Array of urls to delete from storage

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [availableColors, setAvailableColors] = useState(DEFAULT_COLORS)
  const [colorSearch, setColorSearch] = useState('')
  const [showColorSuggestions, setShowColorSuggestions] = useState(false)
  const colorDropdownRef = useRef(null)

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target)) {
        setShowColorSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      resetForm()
      return
    }
    if (mode === 'edit' && product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price || '',
        compare_at_price: product.compare_at_price || '',
        category: product.category || '',
        sizes: product.sizes || [],
        colors: normalizeColors(product.colors),
        quantity: product.quantity || '',
        material: product.material || '',
        fit_notes: product.fit_notes || '',
        care_instructions: product.care_instructions || '',
        is_featured: Boolean(product.is_featured),
        tags: (product.tags || []).join(', '),
      })
      // Load existing images
      const initialImages = []
      if (product.images && product.images.length > 0) {
        product.images.forEach(url => initialImages.push({ id: url, existingUrl: url }))
      } else if (product.image_url) {
        initialImages.push({ id: product.image_url, existingUrl: product.image_url }) // Fallback for old data
      }

      const savedColorImageMap = normalizeColorImageMap(product.color_image_map)
      const availableImageIds = new Set(initialImages.map(getImageId))
      const primaryImageId = getImageId(initialImages[0] || {})
      const initialColorImageMap = Object.fromEntries(
        normalizeColors(product.colors).map((color) => {
          const savedImageIds = (savedColorImageMap[color] || []).filter((url) => availableImageIds.has(url))
          return [color, savedImageIds.length ? savedImageIds : (primaryImageId ? [primaryImageId] : [])]
        })
      )

      setImages(initialImages)
      setColorImageMap(initialColorImageMap)
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
      colors: [],
      quantity: '',
      material: '',
      fit_notes: '',
      care_instructions: '',
      is_featured: false,
      tags: '',
    })
    setImages([])
    setColorImageMap({})
    setImagesToRemove([])
    setErrors({})
    setUploadProgress(null)
    setColorSearch('')
    setShowColorSuggestions(false)
  }

  // Load colors from localStorage on component mount
  useEffect(() => {
    const storedColors = localStorage.getItem('productColors')
    if (storedColors) {
      try {
        const colors = JSON.parse(storedColors)
        const cleaned = normalizeColors(colors)
        // Rewrite clean data back so bad format doesn't persist
        localStorage.setItem('productColors', JSON.stringify(cleaned))
        setAvailableColors(cleaned)
      } catch {
        setAvailableColors(DEFAULT_COLORS)
      }
    }
  }, [])

  const saveColorsToStorage = (colors) => {
    localStorage.setItem('productColors', JSON.stringify(colors))
  }

  const addNewColor = (colorName) => {
    if (!colorName.trim()) return
    if (availableColors.includes(colorName.trim())) return

    const newColors = [...availableColors, colorName.trim()]
    setAvailableColors(newColors)
    saveColorsToStorage(newColors)
  }

  const getFilteredColors = () => {
    return availableColors.filter(color =>
      typeof color === 'string' && color.toLowerCase().includes(colorSearch.toLowerCase())
    )
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
        const id = createImageId()
        setImages(prev => [...prev, { id, file, preview: reader.result }])
        setColorImageMap((prev) => {
          const next = { ...prev }
          // Use formData from state via functional update to avoid stale closure
          setFormData(fd => {
            fd.colors.forEach((color) => {
              if (!next[color]?.length) {
                next[color] = [id]
              }
            })
            return fd // no change to formData
          })
          return next
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index) => {
    const img = images[index]
    const imageId = getImageId(img)
    if (img.existingUrl) {
      setImagesToRemove(prev => [...prev, img.existingUrl])
    }
    setImages(prev => prev.filter((_, i) => i !== index))
    setColorImageMap((prev) => Object.fromEntries(
      Object.entries(prev).map(([color, imageIds]) => [
        color,
        imageIds.filter((id) => id !== imageId),
      ])
    ))
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

  const toggleColor = (color) => {
    const isSelected = formData.colors.includes(color)

    setFormData((prev) => ({
      ...prev,
      colors: isSelected
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
    setColorImageMap((prev) => {
      if (isSelected) {
        const remaining = { ...prev }
        delete remaining[color]
        return remaining
      }

      const primaryImageId = images[0] ? getImageId(images[0]) : null
      return {
        ...prev,
        [color]: prev[color]?.length ? prev[color] : (primaryImageId ? [primaryImageId] : []),
      }
    })
    if (errors.colors) {
      setErrors((prev) => ({ ...prev, colors: null }))
    }
  }

  const toggleColorImage = (color, imageId) => {
    setColorImageMap((prev) => {
      const assignedImages = prev[color] || []
      return {
        ...prev,
        [color]: assignedImages.includes(imageId)
          ? assignedImages.filter((id) => id !== imageId)
          : [...assignedImages, imageId],
      }
    })
    if (errors.color_image_map) {
      setErrors((prev) => ({ ...prev, color_image_map: null }))
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

    // Check if colors are selected
    if (formData.colors.length === 0) {
      setErrors((prev) => ({ ...prev, colors: 'At least one color must be selected' }))
      return
    }

    const currentImageIds = new Set(images.map(getImageId))
    const unmappedColors = formData.colors.filter(
      (color) => !(colorImageMap[color] || []).some((imageId) => currentImageIds.has(imageId))
    )
    if (unmappedColors.length > 0) {
      setErrors((prev) => ({
        ...prev,
        color_image_map: `Assign at least one image to: ${unmappedColors.join(', ')}`,
      }))
      return
    }

    // Check if quantity is provided
    if (!formData.quantity || formData.quantity === '') {
      setErrors((prev) => ({ ...prev, quantity: 'Quantity is required' }))
      return
    }

    if (parseInt(formData.quantity) < 0) {
      setErrors((prev) => ({ ...prev, quantity: 'Quantity cannot be negative' }))
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const finalImagesUrls = [];
      const imageUrlById = {}
      let currentUploadNum = 1;
      const filesToUpload = images.filter(img => img.file);

      setUploadProgress(filesToUpload.length > 0 ? `Uploading images (0/${filesToUpload.length})...` : (mode === 'create' ? 'Creating product...' : 'Updating product...'));

      for (const img of images) {
        if (img.existingUrl) {
          finalImagesUrls.push(img.existingUrl);
          imageUrlById[getImageId(img)] = img.existingUrl
        } else if (img.file) {
          const url = await productService.uploadImage(img.file);
          finalImagesUrls.push(url);
          imageUrlById[getImageId(img)] = url
          setUploadProgress(currentUploadNum < filesToUpload.length ? `Uploading images (${currentUploadNum++}/${filesToUpload.length})...` : (mode === 'create' ? 'Creating product...' : 'Updating product...'));
        }
      }

      const finalColorImageMap = Object.fromEntries(
        formData.colors.map((color) => [
          color,
          (colorImageMap[color] || [])
            .map((imageId) => imageUrlById[imageId])
            .filter(Boolean),
        ])
      )

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        category: formData.category.trim(),
        sizes: formData.sizes,
        colors: formData.colors,
        quantity: parseInt(formData.quantity),
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
        color_image_map: finalColorImageMap,
      }

      if (mode === 'create') {
        await onSuccess(productData)
      } else {
        await onSuccess(product.id, productData)
      }

      imagesToRemove.forEach(url => {
        productService.deleteImage(url).catch(e => console.error('Failed to delete unused image', url, e))
      })

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
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              placeholder="e.g., 50"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              error={errors.quantity}
              required
              disabled={loading}
              helperText={formData.quantity === '0' ? '⚠️ Product will show as SOLD OUT' : 'When 0, product shows as SOLD OUT'}
            />
          </div>

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

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Available Colors <span className="text-red-500">*</span>
          </label>

          {/* Color Search Input */}
          <div className="mb-4 relative" ref={colorDropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search or add new color..."
                value={colorSearch}
                onChange={(e) => setColorSearch(e.target.value)}
                onFocus={() => setShowColorSuggestions(true)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              />
            </div>

            {/* Color Suggestions Dropdown */}
            {showColorSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {getFilteredColors().length > 0 ? (
                    getFilteredColors().map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          toggleColor(color)
                          setColorSearch('')
                          setShowColorSuggestions(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          formData.colors?.includes(color)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        ✓ {color}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No matching colors
                    </div>
                  )}

                  {/* Add New Color Option */}
                  {colorSearch.trim() && !getFilteredColors().some(c => c.toLowerCase() === colorSearch.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        addNewColor(colorSearch)
                        toggleColor(colorSearch.trim())
                        setColorSearch('')
                        setShowColorSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-gray-600 border border-primary-200 dark:border-gray-600"
                    >
                      + Add "{colorSearch}"
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Colors Display */}
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.colors.map((color) => (
              <div
                key={color}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
              >
                <span className="text-sm font-medium">{color}</span>
                <button
                  type="button"
                  onClick={() => toggleColor(color)}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Available Colors Grid */}
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.colors?.includes(color)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {color}
              </button>
            ))}
          </div>

          {errors.colors && <p className="mt-2 text-sm text-red-600 dark:text-red-200">{errors.colors}</p>}
        </div>

        {/* Color variant image mapping */}
        <div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Color Variant Images <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select the images the storefront should show when a customer chooses each color.
            </p>
          </div>

          {formData.colors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
              Select at least one color to configure its product images.
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
              Upload product images before assigning them to colors.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.colors.map((color) => (
                <div
                  key={color}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{color}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(colorImageMap[color] || []).length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, index) => {
                      const imageId = getImageId(img)
                      const isAssigned = (colorImageMap[color] || []).includes(imageId)

                      return (
                        <button
                          key={imageId}
                          type="button"
                          onClick={() => toggleColorImage(color, imageId)}
                          disabled={loading}
                          className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                            isAssigned
                              ? 'border-primary-600 ring-2 ring-primary-200 dark:ring-primary-900'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                          aria-pressed={isAssigned}
                          title={`${isAssigned ? 'Remove' : 'Assign'} image ${index + 1} ${isAssigned ? 'from' : 'to'} ${color}`}
                        >
                          <img
                            src={img.preview || img.existingUrl}
                            alt={`${color} option ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {isAssigned && (
                            <span className="absolute right-1 top-1 rounded-full bg-primary-600 p-1 text-white shadow">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.color_image_map && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-200">{errors.color_image_map}</p>
          )}
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
