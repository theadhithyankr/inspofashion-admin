import { useState, useEffect } from 'react'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { useCollections } from '../../hooks/useCollections'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import { Plus, Trash2 } from 'lucide-react'

export function MenuBarSettings() {
  const { settings, loading, saving, error, saveSettings } = useStoreSettings('menu_bar')
  const { collections } = useCollections()
  const [formData, setFormData] = useState({ announcement_text: '', links: [] })

  useEffect(() => {
    if (settings) {
      setFormData({
        announcement_text: settings.announcement_text || '',
        links: settings.links || [],
      })
    }
  }, [settings])

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...formData.links]
    newLinks[index][field] = value
    setFormData({ ...formData, links: newLinks })
  }

  const addLink = () => {
    setFormData({ ...formData, links: [...formData.links, { name: '', url: '' }] })
  }

  const removeLink = (index) => {
    const newLinks = [...formData.links]
    newLinks.splice(index, 1)
    setFormData({ ...formData, links: newLinks })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await saveSettings(formData)
      alert('Settings saved successfully!')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Menu Bar Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure the top announcement bar and navigation links.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Announcement Bar</h3>
          <Input
            label="Announcement Text"
            value={formData.announcement_text}
            onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
            placeholder="e.g. Free shipping on all orders!"
          />
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Navigation Links</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addLink}>
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </div>

          <div className="space-y-4">
            {formData.links.map((link, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 w-full text-left">
                  <Input
                    label="Link Name"
                    value={link.name}
                    onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
                    placeholder="e.g. Collections"
                    required
                  />
                </div>
                <div className="flex-1 w-full text-left">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Destination <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-[42px]"
                  >
                    <option value="" disabled>Select a destination...</option>
                    <option value="/">Home Page</option>
                    <option value="/search">Search Page</option>
                    
                    {collections && collections.length > 0 && (
                      <optgroup label="Collections">
                        {collections.map(col => (
                          <option key={col.id} value={`/collections/${encodeURIComponent(col.name)}`}>
                            {col.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Preserve existing custom/hash URLs seamlessly */}
                    {link.url && !['/', '/search'].includes(link.url) && !link.url.startsWith('/collections/') && (
                      <option value={link.url}>{link.url} (Custom hash)</option>
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded mt-2 sm:mt-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {formData.links.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic">No navigation links added yet.</p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : 'Save Menu Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
