import { Edit2, Trash2, Link as LinkIcon } from 'lucide-react'
import { ToggleSwitch } from '../products/ToggleSwitch'

export function CollectionTable({ collections, onEdit, onDelete, onToggle }) {
  if (!collections?.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No collections found. Add your first collection above.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y border-b border-gray-200 dark:border-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Collection
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Slug
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {collections.map((collection) => (
            <tr key={collection.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    {collection.image_url ? (
                      <img className="h-10 w-10 rounded-md object-cover" src={collection.image_url} alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{collection.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 w-48 truncate">{collection.description}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {collection.slug}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ToggleSwitch
                  enabled={collection.is_active}
                  onChange={() => onToggle(collection.id, collection.is_active)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(collection)}
                    className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors p-1"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(collection)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}