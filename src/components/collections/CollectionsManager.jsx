import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCollections } from '../../hooks/useCollections'
import { CollectionTable } from './CollectionTable'
import { CollectionModal } from './CollectionModal'
import { DeleteConfirmDialog } from '../products/DeleteConfirmDialog'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

export function CollectionsManager() {
  const { collections, loading, error, createCollection, updateCollection, deleteCollection, toggleActive } = useCollections()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleAddClick = () => {
    setModalMode('create')
    setSelectedCollection(null)
    setModalOpen(true)
  }

  const handleEditClick = (collection) => {
    setModalMode('edit')
    setSelectedCollection(collection)
    setModalOpen(true)
  }

  const handleDeleteClick = (collection) => {
    setSelectedCollection(collection)
    setDeleteDialogOpen(true)
  }

  const handleCreate = async (data) => {
    await createCollection(data)
  }

  const handleUpdate = async (id, data) => {
    await updateCollection(id, data)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCollection) return

    setDeleteLoading(true)
    try {
      await deleteCollection(selectedCollection.id)
      setDeleteDialogOpen(false)
      setSelectedCollection(null)
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('Failed to delete collection.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600 mt-2">Manage your product categories and collections</p>
        </div>
        <Button variant="primary" size="md" onClick={handleAddClick} className="mt-4 sm:mt-0">
          <Plus className="w-5 h-5 mr-2" />
          Add Collection
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <CollectionTable
              collections={collections}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onToggle={toggleActive}
            />
          </div>
        )}
      </div>

      <CollectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        collection={selectedCollection}
        onSuccess={modalMode === 'create' ? handleCreate : handleUpdate}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        item={selectedCollection}
        loading={deleteLoading}
      />
    </div>
  )
}