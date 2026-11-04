import React, { useState, useMemo } from 'react'
import type { Product } from '@/types'
import { Search, Plus, AlertTriangle, Layers, Scissors, ShoppingBag, Box } from 'lucide-react'
import { motion } from 'framer-motion'
import { BOMDrawer } from '@/components/inventory/BOMDrawer'
import { AddRawMaterialDrawer } from '@/components/inventory/AddRawMaterialDrawer'
import { AddItemWeMakeDrawer } from '@/components/inventory/AddItemWeMakeDrawer'
import { AddProductDrawer } from '@/components/inventory/AddProductDrawer'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'RAW_MATERIAL' | 'FINISHED_GOOD'>('ALL')
  const [isBOMDrawerOpen, setIsBOMDrawerOpen] = useState(false)
  const [isAddRawMaterialOpen, setIsAddRawMaterialOpen] = useState(false)
  const [isAddItemWeMakeOpen, setIsAddItemWeMakeOpen] = useState(false)
  const [isAddStandardOpen, setIsAddStandardOpen] = useState(false)
  const [selectedBOMProduct, setSelectedBOMProduct] = useState<Product | null>(null)
  
  const { data: productsData } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => apiClient.getProducts(),
  })
  
  const products: Product[] = productsData?.data || productsData || []

  const isLowStock = (product: Product) => product.stock <= (product.lowStockThreshold ?? 5)

  // Filter products by tab and search
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesTab = activeTab === 'ALL' || product.type === activeTab
      return matchesSearch && matchesTab
    })
  }, [searchQuery, activeTab, products])

  // Categorized counts
  const rawMaterials = products.filter(p => p.type === 'RAW_MATERIAL')
  const finishedGoods = products.filter(p => p.type === 'FINISHED_GOOD')
  const lowStockCount = products.filter(isLowStock).length
  const totalValue = products.reduce((acc: number, p: Product) => acc + (p.price * p.stock), 0)

  const handleOpenAdd = () => {
    if (activeTab === 'RAW_MATERIAL') {
      setIsAddRawMaterialOpen(true)
    } else if (activeTab === 'FINISHED_GOOD') {
      setIsAddItemWeMakeOpen(true)
    } else {
      setIsAddStandardOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Page Header */}
      <div className="px-4 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Inventory & Workshop Stock</h1>
            <p className="text-xs text-muted-foreground">Manage raw materials (cloth, buttons) and items we make (Kurta, Pant).</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'RAW_MATERIAL' ? (
              <button
                onClick={() => setIsAddRawMaterialOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Raw Material</span>
              </button>
            ) : activeTab === 'FINISHED_GOOD' ? (
              <button
                onClick={() => setIsAddItemWeMakeOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Item We Make</span>
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsAddRawMaterialOpen(true)}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Raw Material</span>
                </button>
                <button
                  onClick={() => setIsAddItemWeMakeOpen(true)}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Item We Make</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by material or garment name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Clear Category Tabs */}
        <div className="flex gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            All Items ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('RAW_MATERIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'RAW_MATERIAL'
                ? 'bg-amber-600 text-white'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            🧵 Raw Materials ({rawMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab('FINISHED_GOOD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'FINISHED_GOOD'
                ? 'bg-purple-600 text-white'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            👗 Items We Make ({finishedGoods.length})
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center border border-border">
            <p className="text-[11px] text-muted-foreground font-medium">Stock Value</p>
            <p className="text-base font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center border border-border">
            <p className="text-[11px] text-muted-foreground font-medium">Raw Materials</p>
            <p className="text-base font-bold text-amber-500">{rawMaterials.length}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center border border-border">
            <p className="text-[11px] text-muted-foreground font-medium">Items We Make</p>
            <p className="text-base font-bold text-purple-500">{finishedGoods.length}</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockCount > 0 && (
          <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-destructive">
                  Low Stock Warning ({lowStockCount} item{lowStockCount > 1 ? 's' : ''})
                </p>
                <span className="text-[10px] text-muted-foreground">Action Needed</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {products.filter(isLowStock).map((p: Product) => (
                  <span
                    key={p.id}
                    className="bg-card text-foreground text-[11px] px-2 py-0.5 rounded border border-destructive/30 font-medium inline-flex items-center gap-1 shadow-sm"
                  >
                    <span>{p.name}:</span>
                    <strong className="text-destructive font-bold">{p.stock} {p.unit || 'pcs'}</strong>
                    <span className="text-muted-foreground text-[9px]">(threshold: {p.lowStockThreshold ?? 5})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="px-4 py-4 space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const low = isLowStock(product)
            const isRaw = product.type === 'RAW_MATERIAL'
            const isFinished = product.type === 'FINISHED_GOOD'

            return (
              <div
                key={product.id}
                className={`bg-card border rounded-xl p-4 transition-all shadow-sm ${
                  isRaw 
                    ? 'border-amber-500/30 hover:border-amber-500/60' 
                    : isFinished 
                    ? 'border-purple-500/30 hover:border-purple-500/60'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                      isRaw
                        ? 'bg-amber-500/10 text-amber-500'
                        : isFinished
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isRaw ? (
                      <Scissors className="w-5 h-5" />
                    ) : isFinished ? (
                      <ShoppingBag className="w-5 h-5" />
                    ) : (
                      <Box className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm truncate">
                            {product.name}
                          </h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isRaw
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : isFinished
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isRaw ? '🧵 Raw Material' : isFinished ? '👗 Item We Make' : 'Standard'}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {low && isRaw && (
                        <span className="shrink-0 px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-semibold rounded-full border border-destructive/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Needs Stock
                        </span>
                      )}
                    </div>

                    {/* Stock & Rate Info */}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          {isRaw ? `Purchase Cost / ${product.unit || 'unit'}` : 'Base Selling Price'}
                        </span>
                        <p className="text-sm font-bold text-foreground">
                          ₹{product.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-muted-foreground">
                          {isRaw ? 'Available Material' : 'Ready Stock in Hand'}
                        </span>
                        <p className={`text-sm font-bold ${low && isRaw ? 'text-destructive' : 'text-foreground'}`}>
                          {product.stock} {product.unit || 'pcs'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3 text-[11px]">
                        {product.sku && <span>SKU: <strong className="text-foreground">{product.sku}</strong></span>}
                      </div>

                      {isFinished && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBOMProduct(product)
                            setIsBOMDrawerOpen(true)
                          }}
                          className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>View / Edit Recipe</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl p-6">
            <p className="text-sm font-semibold text-foreground">No items in this category</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'RAW_MATERIAL'
                ? 'Add raw materials like cotton cloth, buttons, or thread.'
                : activeTab === 'FINISHED_GOOD'
                ? 'Add items your workshop builds (e.g. Kurta, Suit, Pant).'
                : 'No items match your search.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
            >
              {activeTab === 'RAW_MATERIAL' ? '+ Add Raw Material' : '+ Add Item We Make'}
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        onClick={handleOpenAdd}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 w-13 h-13 p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-30"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Dedicated Drawers */}
      <AddRawMaterialDrawer
        isOpen={isAddRawMaterialOpen}
        onClose={() => setIsAddRawMaterialOpen(false)}
      />

      <AddItemWeMakeDrawer
        isOpen={isAddItemWeMakeOpen}
        onClose={() => setIsAddItemWeMakeOpen(false)}
      />

      <AddProductDrawer
        isOpen={isAddStandardOpen}
        onClose={() => setIsAddStandardOpen(false)}
      />

      <BOMDrawer 
        isOpen={isBOMDrawerOpen} 
        onClose={() => setIsBOMDrawerOpen(false)} 
        product={selectedBOMProduct} 
      />
    </div>
  )
}
