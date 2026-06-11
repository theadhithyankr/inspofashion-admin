import { useState, useEffect } from 'react'
import { productService } from '../services/productService'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productService.getAllProducts()
      setProducts(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const createProduct = async (productData) => {
    const newProduct = await productService.createProduct(productData)
    setProducts(prev => [newProduct, ...prev])
    return newProduct
  }

  const updateProduct = async (id, updates) => {
    const updated = await productService.updateProduct(id, updates)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  const deleteProduct = async (id, imageUrl) => {
    await productService.deleteProduct(id)
    if (imageUrl) {
      await productService.deleteImage(imageUrl)
    }
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const toggleActive = async (id, isActive) => {
    const updated = await productService.toggleActive(id, isActive)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
  }
}
