import { useState, useEffect } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { Spinner } from '../ui/Spinner'

export function ValuePropsSettings() {
  const { settings, loading, saving, error, saveSettings } = useStoreSettings('value_props')
  
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    is_visible: true,
    props: [
      {
        title: 'Wear All Day Comfort',
        description: 'Lightweight, bouncy, and wildly comfortable...'
      },
      {
        title: 'Sustainability In Every Step',
        description: 'From materials to transport, we\'re working to reduce our carbon footprint...'
      },
      {
        title: 'Materials From The Earth',
        description: 'We replace petroleum-based synthetics with natural alternatives...'
      }
    ]
  })

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        is_visible: settings.is_visible !== undefined ? settings.is_visible : true,
        props: settings.props || prev.props
      }))
    }
  }, [settings])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    try {
      await saveSettings(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save value props:', err)
    }
  }

  const handleAddProp = () => {
    if (formData.props.length >= 4) {
      return alert('Maximum of 4 value propositions allowed.')
    }
    setFormData({
      ...formData,
      props: [...formData.props, { title: 'New Value Prop', description: 'Description here...' }]
    })
  }

  const handleRemoveProp = (index) => {
    const newProps = [...formData.props]
    newProps.splice(index, 1)
    setFormData({ ...formData, props: newProps })
  }

  const handlePropChange = (index, field, value) => {
    const newProps = [...formData.props]
    newProps[index] = { ...newProps[index], [field]: value }
    setFormData({ ...formData, props: newProps })
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Value Props Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage the 3 features/values highlighted at the bottom of the home page.</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size="sm" className="mr-2" /> : success ? <Check className="w-5 h-5 mr-2" /> : null}
          {success ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Enable Value Props Section</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle whether this section is visible on the storefront.</p>
          </div>
          <button
            onClick={() => setFormData({...formData, is_visible: !formData.is_visible})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              formData.is_visible ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.is_visible ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {formData.is_visible && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Items</h2>
            <Button onClick={handleAddProp} variant="secondary" size="sm" disabled={formData.props.length >= 4}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-6">
            {formData.props.map((prop, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 space-y-4">
                  <Input
                    label="Title"
                    value={prop.title}
                    onChange={(e) => handlePropChange(index, 'title', e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                    <textarea
                      value={prop.description}
                      onChange={(e) => handlePropChange(index, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProp(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors mt-6"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {formData.props.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic">No value props added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
