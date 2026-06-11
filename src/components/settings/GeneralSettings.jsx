import { useState, useEffect } from 'react'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

export function GeneralSettings() {
  const { settings, loading, saving, error, saveSettings } = useStoreSettings('general_settings')
  const [formData, setFormData] = useState({ store_name: '', support_email: '', whatsapp_number: '' })
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        support_email: settings.support_email || '',
        whatsapp_number: settings.whatsapp_number ? settings.whatsapp_number.replace(/^\+91/, '') : ''
      })
    }
  }, [settings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Automatically prepend +91 for the database
    let formattedNumber = formData.whatsapp_number.trim()
    if (formattedNumber && !formattedNumber.startsWith('+91')) {
      formattedNumber = `+91${formattedNumber}`
    }

    const dataToSave = {
      ...formData,
      whatsapp_number: formattedNumber
    }

    try {
      await saveSettings(dataToSave)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">General Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure core settings and contact information.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-6">
        <div className="space-y-4 max-w-lg">
          <Input
            label="Store Name"
            value={formData.store_name}
            onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
            placeholder="e.g. Inspofashions"
            required
          />
          <Input
            label="Support Email"
            type="email"
            value={formData.support_email}
            onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
            placeholder="e.g. help@inspofashions.com"
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              WhatsApp Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 sm:text-sm">
                +91
              </span>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">+91 is added automatically for Indian numbers. This is where checkout messages will be sent.</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-gray-200 dark:border-gray-800">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : success ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
