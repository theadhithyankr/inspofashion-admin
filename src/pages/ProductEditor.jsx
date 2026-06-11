import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, Upload, X, Search } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { productService } from '../services/productService'
import { validateProduct, validateImageFile } from '../utils/validators'
import { normalizeColorImageMap } from '../utils/productVariants'
import { useCollections } from '../hooks/useCollections'

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const DEFAULT_COLORS = [
  'White', 'Black', 'Gray', 'Navy', 'Red', 'Blue', 'Green',
  'Yellow', 'Pink', 'Purple', 'Beige', 'Brown', 'Olive',
]

function createImageId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `img-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getImageId(image) {
  return image.id || image.existingUrl
}

function makeEmptyForm() {
  return {
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
  }
}

function parseArray(value) {
  if (Array.isArray(value)) {
    // Normalize color objects {name, hex} → plain strings
    return value.map(item => {
      if (item && typeof item === 'object' && item.name) {
        return String(item.name).trim()
      }
      return String(item).trim()
    }).filter(Boolean)
  }
  if (typeof value === 'string') {
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value)
        return parseArray(parsed) // recurse to normalize any objects inside
      } catch { /* fall through */ }
    }
    if (value.startsWith('{')) {
      try {
        return value.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean)
      } catch { /* fall through */ }
    }
    // Try to split by comma for plain text
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

function productToForm(product) {
  return {
    title: product.title ?? '',
    description: product.description ?? '',
    price: product.price != null ? String(product.price) : '',
    compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : '',
    category: product.category ?? '',
    sizes: parseArray(product.sizes),
    colors: parseArray(product.colors),
    quantity: product.quantity != null ? String(product.quantity) : '',
    material: product.material ?? '',
    fit_notes: product.fit_notes ?? '',
    care_instructions: product.care_instructions ?? '',
    is_featured: Boolean(product.is_featured),
    tags: Array.isArray(product.tags)
      ? product.tags.join(', ')
      : (typeof product.tags === 'string' ? product.tags : ''),
  }
}

function productToImages(product) {
  // images may arrive as a JS array or as a Postgres array string like "{url1,url2}"
  let imgs = product.images
  if (typeof imgs === 'string') {
    // parse Postgres array literal
    try {
      imgs = imgs.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean)
    } catch {
      imgs = []
    }
  }
  if (Array.isArray(imgs) && imgs.length > 0) {
    return imgs.map(url => ({ id: url, existingUrl: url }))
  }
  if (product.image_url) {
    return [{ id: product.image_url, existingUrl: product.image_url }]
  }
  return []
}

function productToColorImageMap(product, initialImages) {
  const savedMap = normalizeColorImageMap(product.color_image_map)
  const availableIds = new Set(initialImages.map(getImageId))
  const primaryId = initialImages[0] ? getImageId(initialImages[0]) : null
  const colors = parseArray(product.colors)

  return Object.fromEntries(
    colors.map(color => {
      const saved = (savedMap[color] || []).filter(id => availableIds.has(id))
      return [color, saved.length ? saved : (primaryId ? [primaryId] : [])]
    })
  )
}

export function ProductEditor({ mode = 'create', product = null, onSuccess, onCancel }) {
  const { collections } = useCollections()

  const [formData, setFormData] = useState(() =>
    mode === 'edit' && product ? productToForm(product) : makeEmptyForm()
  )
  const [images, setImages] = useState(() => {
    if (mode === 'edit' && product) return productToImages(product)
    return []
  })
  const [colorImageMap, setColorImageMap] = useState(() => {
    if (mode === 'edit' && product) {
      const imgs = productToImages(product)
      return productToColorImageMap(product, imgs)
    }
    return {}
  })
  const [imagesToRemove, setImagesToRemove] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [availableColors, setAvailableColors] = useState(() => {
    try {
      const stored = localStorage.getItem('productColors')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Normalize any {name, hex} objects that may have been saved previously
        const cleaned = parsed.map(c => {
          if (c && typeof c === 'object' && c.name) {
            return String(c.name).trim()
          }
          return String(c).trim()
        }).filter(Boolean)
        // Rewrite clean data back so it doesn't persist in bad format
        localStorage.setItem('productColors', JSON.stringify(cleaned))
        return cleaned
      }
    } catch { /* ignore */ }
    return DEFAULT_COLORS
  })
  const [colorSearch, setColorSearch] = useState('')
  const [showColorSuggestions, setShowColorSuggestions] = useState(false)
  const colorDropdownRef = useRef(null)

  // Re-populate if product prop changes (e.g. navigating between edits)
  useEffect(() => {
    if (mode === 'edit' && product) {
      const imgs = productToImages(product)
      const form = productToForm(product)
      const colorMap = productToColorImageMap(product, imgs)
      
      setFormData(form)
      setImages(imgs)
      setColorImageMap(colorMap)
      setImagesToRemove([])
      setErrors({})
      setSavedSuccess(false)
    } else if (mode === 'create') {
      setFormData(makeEmptyForm())
      setImages([])
      setColorImageMap({})
      setImagesToRemove([])
      setErrors({})
      setSavedSuccess(false)
    }
  }, [mode, product?.id]) // only re-run when the actual product ID changes

  // Close color dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target)) {
        setShowColorSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── helpers ──────────────────────────────────────────────────────────────

  const saveColorsToStorage = (colors) => {
    try { localStorage.setItem('productColors', JSON.stringify(colors)) } catch { /* ignore */ }
  }

  const addNewColor = (colorName) => {
    const trimmed = colorName.trim()
    if (!trimmed || availableColors.includes(trimmed)) return
    const next = [...availableColors, trimmed]
    setAvailableColors(next)
    saveColorsToStorage(next)
  }

  const getFilteredColors = () =>
    availableColors.filter(c => typeof c === 'string' && c.toLowerCase().includes(colorSearch.toLowerCase()))

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  // ── image handling ────────────────────────────────────────────────────────

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(file => {
      const v = validateImageFile(file)
      if (!v.isValid) {
        setErrors(prev => ({ ...prev, image: v.errors.join(', ') }))
        return false
      }
      return true
    })
    setErrors(prev => ({ ...prev, image: null }))

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const id = createImageId()
        setImages(prev => [...prev, { id, file, preview: reader.result }])
        // Assign new image to colors that have no image yet
        setColorImageMap(prev => {
          const next = { ...prev }
          setFormData(fd => {
            fd.colors.forEach(color => {
              if (!next[color]?.length) next[color] = [id]
            })
            return fd
          })
          return next
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index) => {
    const img = images[index]
    if (!img) return
    const imageId = getImageId(img)
    if (img.existingUrl) setImagesToRemove(prev => [...prev, img.existingUrl])
    setImages(prev => prev.filter((_, i) => i !== index))
    setColorImageMap(prev =>
      Object.fromEntries(
        Object.entries(prev).map(([color, ids]) => [color, ids.filter(id => id !== imageId)])
      )
    )
  }

  // ── size / color toggling ─────────────────────────────────────────────────

  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }))
    if (errors.sizes) setErrors(prev => ({ ...prev, sizes: null }))
  }

  const toggleColor = (color) => {
    setFormData(prev => {
      const isSelected = prev.colors.includes(color)
      const newColors = isSelected
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]

      setColorImageMap(map => {
        if (isSelected) {
          const next = { ...map }
          delete next[color]
          return next
        }
        const primaryId = images[0] ? getImageId(images[0]) : null
        return {
          ...map,
          [color]: map[color]?.length ? map[color] : (primaryId ? [primaryId] : []),
        }
      })

      return { ...prev, colors: newColors }
    })
    if (errors.colors) setErrors(prev => ({ ...prev, colors: null }))
  }

  const toggleColorImage = (color, imageId) => {
    setColorImageMap(prev => {
      const assigned = prev[color] || []
      return {
        ...prev,
        [color]: assigned.includes(imageId)
          ? assigned.filter(id => id !== imageId)
          : [...assigned, imageId],
      }
    })
    if (errors.color_image_map) setErrors(prev => ({ ...prev, color_image_map: null }))
  }

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateProduct(formData)
    if (!validation.isValid) { setErrors(validation.errors); return }
    if (images.length === 0) { setErrors(prev => ({ ...prev, image: 'At least one image is required' })); return }
    if (formData.colors.length === 0) { setErrors(prev => ({ ...prev, colors: 'At least one color must be selected' })); return }

    const currentImageIds = new Set(images.map(getImageId))
    const unmappedColors = formData.colors.filter(
      color => !(colorImageMap[color] || []).some(id => currentImageIds.has(id))
    )
    if (unmappedColors.length > 0) {
      setErrors(prev => ({ ...prev, color_image_map: `Assign at least one image to: ${unmappedColors.join(', ')}` }))
      return
    }
    if (formData.quantity === '' || formData.quantity == null) {
      setErrors(prev => ({ ...prev, quantity: 'Quantity is required' }))
      return
    }
    if (parseInt(formData.quantity) < 0) {
      setErrors(prev => ({ ...prev, quantity: 'Quantity cannot be negative' }))
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const finalImageUrls = []
      const imageUrlById = {}
      const filesToUpload = images.filter(img => img.file)
      let uploadedCount = 0

      setUploadProgress(
        filesToUpload.length > 0
          ? `Uploading images (0/${filesToUpload.length})...`
          : mode === 'create' ? 'Creating product...' : 'Updating product...'
      )

      for (const img of images) {
        if (img.existingUrl) {
          finalImageUrls.push(img.existingUrl)
          imageUrlById[getImageId(img)] = img.existingUrl
        } else if (img.file) {
          const url = await productService.uploadImage(img.file)
          finalImageUrls.push(url)
          imageUrlById[getImageId(img)] = url
          uploadedCount++
          setUploadProgress(
            uploadedCount < filesToUpload.length
              ? `Uploading images (${uploadedCount}/${filesToUpload.length})...`
              : mode === 'create' ? 'Creating product...' : 'Updating product...'
          )
        }
      }

      const finalColorImageMap = Object.fromEntries(
        formData.colors.map(color => [
          color,
          (colorImageMap[color] || []).map(id => imageUrlById[id]).filter(Boolean),
        ])
      )

      const productData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        category: formData.category.trim(),
        sizes: formData.sizes,
        colors: formData.colors,
        quantity: parseInt(formData.quantity),
        material: (formData.material || '').trim(),
        fit_notes: (formData.fit_notes || '').trim(),
        care_instructions: (formData.care_instructions || '').trim(),
        is_featured: formData.is_featured,
        tags: (formData.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        images: finalImageUrls,
        image_url: finalImageUrls[0] || null,
        color_image_map: finalColorImageMap,
      }

      if (mode === 'create') {
        await onSuccess(productData)
      } else {
        await onSuccess(product.id, productData)
      }

      imagesToRemove.forEach(url => {
        productService.deleteImage(url).catch(err => console.error('Failed to delete image', url, err))
      })

      setSavedSuccess(true)
      setTimeout(() => {
        setSavedSuccess(false)
        onCancel()
      }, 800)
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save product. Please try again.' })
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {mode === 'create' ? 'Add New Product' : `Edit — ${formData.title || product?.title || 'Product'}`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* ── IMAGES ─────────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Product Images <span className="text-red-500">*</span>
          </h2>

          <div className="flex flex-wrap gap-4 mb-3">
            {images.map((img, index) => (
              <div key={getImageId(img)} className="relative inline-block">
                <img
                  src={img.preview || img.existingUrl}
                  alt={`Preview ${index + 1}`}
                  className={`h-28 w-28 rounded-lg object-cover ${
                    img.file ? 'border-2 border-green-500' : 'border border-gray-200 dark:border-gray-700'
                  }`}
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
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
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

          <p className="text-xs text-gray-400 dark:text-gray-500">
            PNG, JPG, WebP · max 5 MB each · first image is the primary one
          </p>
          {errors.image && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image}</p>}
        </section>

        {/* ── BASIC INFO ──────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Basic Information</h2>

          <Input
            label="Title"
            placeholder="e.g., Red Cotton T-Shirt"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            error={errors.title}
            required
            disabled={loading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Description
            </label>
            <textarea
              placeholder="Describe the product..."
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="999"
              value={formData.price}
              onChange={e => handleChange('price', e.target.value)}
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
              onChange={e => handleChange('compare_at_price', e.target.value)}
              error={errors.compare_at_price}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 50"
                value={formData.quantity}
                onChange={e => handleChange('quantity', e.target.value)}
                error={errors.quantity}
                required
                disabled={loading}
              />
              {formData.quantity === '0' && !errors.quantity && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Product will show as SOLD OUT
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={e => handleChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                required
                disabled={loading}
              >
                <option value="">Select category...</option>
                {collections.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
              )}
            </div>
          </div>
        </section>

        {/* ── VARIANTS ────────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Variants</h2>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Available Sizes <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    formData.sizes.includes(size)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {errors.sizes && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sizes}</p>
            )}
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Available Colors <span className="text-red-500">*</span>
            </label>

            <div className="mb-4 relative" ref={colorDropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search or add new color..."
                  value={colorSearch}
                  onChange={e => setColorSearch(e.target.value)}
                  onFocus={() => setShowColorSuggestions(true)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                />
              </div>

              {showColorSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {getFilteredColors().length > 0 ? (
                      getFilteredColors().map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            toggleColor(color)
                            setColorSearch('')
                            setShowColorSuggestions(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            formData.colors.includes(color)
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
                    {colorSearch.trim() && !getFilteredColors().some(
                      c => c.toLowerCase() === colorSearch.toLowerCase()
                    ) && (
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

            {/* Selected color chips */}
            {formData.colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.colors.map(color => (
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
            )}

            {/* Full color grid */}
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    formData.colors.includes(color)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
            {errors.colors && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.colors}</p>
            )}
          </div>
        </section>

        {/* ── COLOR → IMAGE MAPPING ───────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Color Variant Images <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select which images the storefront shows when a customer picks each color.
            </p>
          </div>

          {formData.colors.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Select at least one color above to configure images.
            </p>
          ) : images.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Upload product images above before assigning them to colors.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.colors.map(color => (
                <div
                  key={color}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {color}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(colorImageMap[color] || []).length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => {
                      const imageId = getImageId(img)
                      const isAssigned = (colorImageMap[color] || []).includes(imageId)
                      return (
                        <button
                          key={imageId}
                          type="button"
                          onClick={() => toggleColorImage(color, imageId)}
                          disabled={loading}
                          aria-pressed={isAssigned}
                          title={`${isAssigned ? 'Remove' : 'Assign'} image ${idx + 1} ${isAssigned ? 'from' : 'to'} ${color}`}
                          className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                            isAssigned
                              ? 'border-primary-600 ring-2 ring-primary-200 dark:ring-primary-900'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <img
                            src={img.preview || img.existingUrl}
                            alt={`${color} option ${idx + 1}`}
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
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.color_image_map}</p>
          )}
        </section>

        {/* ── ADDITIONAL DETAILS ──────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Additional Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Material"
              placeholder="e.g., Cotton linen blend"
              value={formData.material}
              onChange={e => handleChange('material', e.target.value)}
              disabled={loading}
            />
            <Input
              label="Tags"
              placeholder="Comma separated: summer, relaxed fit"
              value={formData.tags}
              onChange={e => handleChange('tags', e.target.value)}
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
                onChange={e => handleChange('fit_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-700"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Care Instructions
              </label>
              <textarea
                value={formData.care_instructions}
                onChange={e => handleChange('care_instructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 dark:border-gray-700"
                disabled={loading}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={e => handleChange('is_featured', e.target.checked)}
              disabled={loading}
              className="h-4 w-4 accent-primary-600"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Feature on storefront
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Featured products appear first in the storefront.
              </span>
            </span>
          </label>
        </section>

        {/* ── PROGRESS + ACTIONS ──────────────────────────────────────────── */}
        {uploadProgress && (
          <div className="bg-primary-50 border border-primary-200 text-primary-700 dark:bg-gray-800 dark:border-gray-700 dark:text-primary-200 px-4 py-3 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 flex-shrink-0" />
            {uploadProgress}
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || savedSuccess}
          >
            {loading
              ? <><Spinner size="sm" className="mr-2" /> Saving...</>
              : savedSuccess
                ? <><Check className="w-4 h-4 mr-2" /> Saved!</>
                : mode === 'create' ? 'Add Product' : 'Save Changes'
            }
          </Button>
        </div>

      </form>
    </div>
  )
}
