import { useState } from 'react'
import { Pencil, Trash2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { VariantModal } from './VariantModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { getColorBrightness } from '../../utils/colorValidator'

export function VariantList({ 
  variants = [], 
  onAddVariant, 
  onUpdateVariant, 
  onDeleteVariant,
  productTitle = '',
  loading = false 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleAddClick = () => {
    setModalMode('create')
    setSelectedVariant(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (variant) => {
    setModalMode('edit')
    setSelectedVariant(variant)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (variant) => {
    setDeleteConfirm({
      title: `Delete "${variant.colorName}" variant?`,
      description: `This will remove the ${variant.colorName} color variant (SKU: ${variant.sku}). This action cannot be undone.`,
      onConfirm: () => {
        onDeleteVariant(variant.id)
        setDeleteConfirm(null)
      },
      onCancel: () => setDeleteConfirm(null),
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedVariant(null)
  }

  const handleModalSuccess = async (variantData) => {
    if (modalMode === 'create') {
      await onAddVariant(variantData)
    } else {
      await onUpdateVariant()
    }
    handleModalClose()
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No color variants added yet</p>
          <Button onClick={handleAddClick} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Variant
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Color Variants ({variants.length})
        </h3>
        <Button 
          onClick={handleAddClick} 
          disabled={loading}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Color
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Images
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {variants.map((variant) => (
              <tr key={variant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: variant.colorCode }}
                      title={variant.colorCode}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {variant.colorName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {variant.colorCode}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {variant.sku}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    variant.stockQuantity > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {variant.stockQuantity} units
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {variant.images?.length || 0} images
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {variant.price ? `₹${parseFloat(variant.price).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(variant)}
                    disabled={loading}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(variant)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
                  style={{ backgroundColor: variant.colorCode }}
                  title={variant.colorCode}
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {variant.colorName}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {variant.colorCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">SKU:</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{variant.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                <span className={variant.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {variant.stockQuantity} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Images:</span>
                <span className="text-gray-900 dark:text-gray-100">{variant.images?.length || 0}</span>
              </div>
              {variant.price && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price:</span>
                  <span className="text-gray-900 dark:text-gray-100">₹{parseFloat(variant.price).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick(variant)}
                disabled={loading}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(variant)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 text-red-600 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <VariantModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        variant={selectedVariant}
        productTitle={productTitle}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          isOpen={true}
          title={deleteConfirm.title}
          description={deleteConfirm.description}
          onConfirm={deleteConfirm.onConfirm}
          onCancel={deleteConfirm.onCancel}
          loading={loading}
        />
      )}
    </div>
  )
}
