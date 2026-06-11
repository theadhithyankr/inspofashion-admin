import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { ProductTable } from '../components/products/ProductTable'
import { ProductEditor } from './ProductEditor'
import { DeleteConfirmDialog } from '../components/products/DeleteConfirmDialog'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { CollectionsManager } from '../components/collections/CollectionsManager'
import { HeroImageSettings } from '../components/settings/HeroImageSettings'
import { MenuBarSettings } from '../components/settings/MenuBarSettings'
import { FooterSettings } from '../components/settings/FooterSettings'
import { ValuePropsSettings } from '../components/settings/ValuePropsSettings'
import { GeneralSettings } from '../components/settings/GeneralSettings'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('Products')

  // 'list' | 'create' | 'edit'
  const [productView, setProductView] = useState('list')

  const { products, loading, error, createProduct, updateProduct, deleteProduct, toggleActive } = useProducts()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleAddClick = () => {
    setSelectedProduct(null)
    setProductView('create')
  }

  const handleEditClick = (product) => {
    setSelectedProduct(product)
    setProductView('edit')
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab !== 'Products') {
      setProductView('list') // reset so coming back always shows the list
    }
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
      // ── Full-page editor (add / edit) ─────────────────────────────────
      if (productView === 'create' || productView === 'edit') {
        const backToList = () => { setProductView('list'); setSelectedProduct(null) }
        return (
          <ErrorBoundary onReset={backToList}>
            <ProductEditor
              key={selectedProduct?.id ?? 'create'}
              mode={productView}
              product={selectedProduct}
              onSuccess={productView === 'create' ? handleProductCreate : handleProductUpdate}
              onCancel={backToList}
            />
          </ErrorBoundary>
        )
      }

      // ── Product list ──────────────────────────────────────────────────
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
    <DashboardLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderContent()}
    </DashboardLayout>
  )
}

