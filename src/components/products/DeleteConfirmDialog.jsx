import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AlertTriangle } from 'lucide-react'

export function DeleteConfirmDialog({ isOpen, onClose, onConfirm, product, item, loading }) {
  const isCollection = !!item;
  const targetItem = isCollection ? item : product;
  const DisplayName = targetItem?.title || targetItem?.name || 'this item';
  const typeLabel = isCollection ? 'Collection' : 'Product';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${typeLabel}`} size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Are you sure?
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          This will permanently delete <strong>{DisplayName}</strong> and remove its image from storage.
          This action cannot be undone.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Delete {typeLabel}
        </Button>
      </div>
    </Modal>
  )
}
