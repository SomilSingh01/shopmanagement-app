
import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import type { Product } from '@/types'
import { Search, Filter, Plus, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BOMDrawer } from '@/components/inventory/BOMDrawer'
import { AddProductDrawer } from '@/components/inventory/AddProductDrawer'

import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isBOMDrawerOpen, setIsBOMDrawerOpen] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [selectedBOMProduct, setSelectedBOMProduct] = useState<Product | null>(null)
  
  const { data: productsData } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => apiClient.getProducts(),
  })
  
  const products = productsData?.data || productsData || []

  const filteredProducts = React.useMemo(() => {
    return products.filter(
      (product: Product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, products])

  const isLowStock = (product: Product) => product.stock <= 10

  const totalItems = products.length;
  const totalValue = products.reduce((acc: number, p: Product) => acc + (p.price * p.stock), 0);
  const lowStockCount = products.filter(isLowStock).length;

  const dynamicStats = [
    { label: 'Total Items', value: totalItems.toString() },
    { label: 'Total Value', value: `₹${totalValue.toLocaleString()}` },
    { label: 'Low Stock', value: lowStockCount.toString() },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header showActions={false} />

      {/* Page Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Inventory</h1>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
            />
          </div>
          <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <Filter className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {dynamicStats.map((stat, index) => (
            <div
              key={index}
              className="bg-muted rounded-lg p-3 text-center border border-border"
            >
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="px-4 py-4 space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-card border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Badge */}
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                  {product.type[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Type: {product.type.replace('_', ' ')}
                      </p>
                    </div>
                    {isLowStock(product) && (
                      <div className="flex-shrink-0 p-1.5 bg-danger/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-danger" />
                      </div>
                    )}
                  </div>

                  {/* Pricing & Stock */}
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-semibold text-foreground">
                        ₹{product.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isLowStock(product) ? 'text-danger' : 'text-success'}`}>
                        {product.stock} {product.unit || 'units'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Stock</p>
                    </div>
                  </div>

                  {product.sku && (
                    <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
                      <span>SKU: {product.sku}</span>
                      {product.dimensions && <span>Dims: {product.dimensions}</span>}
                    </div>
                  )}

                  {product.type === 'FINISHED_GOOD' && (
                      <div>
                        <button 
                          onClick={() => {
                            setSelectedBOMProduct(product)
                            setIsBOMDrawerOpen(true)
                          }}
                          className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors mt-3"
                        >
                          Edit Recipe (BOM)
                        </button>
                      </div>
                    )}

                  {/* Stock Bar */}
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isLowStock(product) ? 'bg-danger' : 'bg-success'
                      }`}
                      style={{
                        width: `${Math.min((product.stock / 100) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>

      {/* FAB - Add Product */}
      <motion.button
        onClick={() => setIsAddProductOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <BOMDrawer 
        isOpen={isBOMDrawerOpen} 
        onClose={() => setIsBOMDrawerOpen(false)} 
        product={selectedBOMProduct} 
      />

      <AddProductDrawer
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
      />
    </div>
  )
}
