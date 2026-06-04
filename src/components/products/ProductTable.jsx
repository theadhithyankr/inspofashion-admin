import { useState } from 'react'
import { Pencil, Trash2, ImageOff } from 'lucide-react'
import { ToggleSwitch } from './ToggleSwitch'
import { Button } from '../ui/Button'

function ProductImage({ src, alt, className }) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        <ImageOff className="w-6 h-6 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}

export function ProductTable({ products, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(null)

  const handleToggle = async (product) => {
    setToggling(product.id)
    try {
      await onToggle(product.id, !product.is_active)
    } catch (error) {
      console.error('Error toggling product:', error)
    } finally {
      setToggling(null)
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No products yet. Add your first product to get started!</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sizes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <ProductImage
                    src={product.image_url}
                    alt={product.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.title}</div>
                  {product.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-gray-800 dark:text-primary-200">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  ₹{parseFloat(product.price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {product.sizes.join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={product.is_active}
                      onChange={() => handleToggle(product)}
                      disabled={toggling === product.id}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex space-x-4">
              <ProductImage
                src={product.image_url}
                alt={product.title}
                className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">{product.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">₹{parseFloat(product.price).toFixed(2)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sizes: {product.sizes.join(', ')}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ToggleSwitch
                  enabled={product.is_active}
                  onChange={() => handleToggle(product)}
                  disabled={toggling === product.id}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(product)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
