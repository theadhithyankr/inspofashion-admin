import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { ProductTable } from '../components/products/ProductTable'
import { ProductModal } from '../components/products/ProductModal'
import { DeleteConfirmDialog } from '../components/products/DeleteConfirmDialog'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { CollectionsManager } from '../components/collections/CollectionsManager'
import { HeroImageSettings } from '../components/settings/HeroImageSettings'
import { MenuBarSettings } from '../components/settings/MenuBarSettings'
import { FooterSettings } from '../components/settings/FooterSettings'
import { ValuePropsSettings } from '../components/settings/ValuePropsSettings'
import { GeneralSettings } from '../components/settings/GeneralSettings'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('Products')
  
  const { products, loading, error, createProduct, updateProduct, deleteProduct, toggleActive } = useProducts()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleAddClick = () => {
    setModalMode('create')
    setSelectedProduct(null)
    setModalOpen(true)
  }

  const handleEditClick = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setModalOpen(true)
  }

  const handleDeleteClick = (product) => {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleProductCreate = async (productData) => {
    await createProduct(productData)
  }

  const handleProductUpdate = async (id, productData) => {
    await updateProduct(id, productData)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return

    setDeleteLoading(true)
    try {
      await deleteProduct(selectedProduct.id, selectedProduct.image_url)
      setDeleteDialogOpen(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const renderContent = () => {
    if (activeTab === 'Products') {
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Product Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your clothing catalog</p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleAddClick}
              className="mt-4 sm:mt-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <ProductTable
                  products={products}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onToggle={toggleActive}
                />
              </div>
            )}
          </div>

          <ProductModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            mode={modalMode}
            product={selectedProduct}
            onSuccess={modalMode === 'create' ? handleProductCreate : handleProductUpdate}
          />

          <DeleteConfirmDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDeleteConfirm}
            product={selectedProduct}
            loading={deleteLoading}
          />
        </div>
      )
    }

    if (activeTab === 'Collections') {
      return <CollectionsManager />
    }

    if (activeTab === 'Hero Image') {
      return <HeroImageSettings />
    }

    if (activeTab === 'Menu Bar') {
      return <MenuBarSettings />
    }

    if (activeTab === 'Footer') {
      return <FooterSettings />
    }

    if (activeTab === 'Value Props') {
      return <ValuePropsSettings />
    }

    if (activeTab === 'Settings') {
      return <GeneralSettings />
    }

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{activeTab}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Configure and manage {activeTab.toLowerCase()} settings for Inspofashions.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Management feature coming soon</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              The {activeTab} editor is currently being connected to the storefront. You will be able to customize this component dynamically once the API is available.
            </p>
            <Button variant="secondary" className="mt-6" onClick={() => setActiveTab('Products')}>
              Return to Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}

