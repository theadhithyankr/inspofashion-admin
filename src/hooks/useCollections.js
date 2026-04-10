import { useState, useEffect, useCallback } from 'react'
import { collectionService } from '../services/collectionService'

export function useCollections() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true)
      const data = await collectionService.getCollections()
      setCollections(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const createCollection = async (collectionData) => {
    try {
      const newCollection = await collectionService.createCollection(collectionData)
      setCollections([newCollection, ...collections])
      return newCollection
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateCollection = async (id, collectionData) => {
    try {
      const updatedCollection = await collectionService.updateCollection(id, collectionData)
      setCollections(collections.map(c => c.id === id ? updatedCollection : c))
      return updatedCollection
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteCollection = async (id) => {
    try {
      await collectionService.deleteCollection(id)
      setCollections(collections.filter(c => c.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const updatedCollection = await collectionService.toggleActive(id, currentStatus)
      setCollections(collections.map(c => c.id === id ? updatedCollection : c))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleActive,
    refresh: fetchCollections
  }
}