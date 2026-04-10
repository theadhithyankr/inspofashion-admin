import { useState, useEffect, useCallback } from 'react'
import { storeSettingsService } from '../services/storeSettingsService'

export function useStoreSettings(key) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await storeSettingsService.getSettings(key)
      setSettings(data || {})
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveSettings = async (newSettings) => {
    try {
      setSaving(true)
      const updated = await storeSettingsService.updateSettings(key, newSettings)
      setSettings(updated)
      setError(null)
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (file, path) => {
    try {
      setLoading(true) // Treat image upload as a major operation
      return await storeSettingsService.uploadImage(file, path)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, saving, error, saveSettings, uploadImage, refresh: fetchSettings }
}
