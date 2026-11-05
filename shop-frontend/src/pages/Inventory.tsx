import React, { useState, useMemo } from 'react'
import type { Product } from '@/types'
import { Search, Plus, AlertTriangle, Layers, Scissors, ShoppingBag, Box, IndianRupee, Sparkles, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOMDrawer } from '@/components/inventory/BOMDrawer'
import { AddRawMaterialDrawer } from '@/components/inventory/AddRawMaterialDrawer'
import { AddItemWeMakeDrawer } from '@/components/inventory/AddItemWeMakeDrawer'
import { AddReadyMadeDrawer } from '@/components/inventory/AddReadyMadeDrawer'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'STANDARD' | 'RAW_MATERIAL' | 'FINISHED_GOOD'>('ALL')
  
  // Drawers
  const [isBOMDrawerOpen, setIsBOMDrawerOpen] = useState(false)
  const [isAddRawMaterialOpen, setIsAddRawMaterialOpen] = useState(false)
  const [isAddItemWeMakeOpen, setIsAddItemWeMakeOpen] = useState(false)
  const [isAddReadyMadeOpen, setIsAddReadyMadeOpen] = useState(false)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false)
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

  // Categorized items
  const readyMadeItems = products.filter(p => p.type === 'STANDARD')
  const rawMaterials = products.filter(p => p.type === 'RAW_MATERIAL')
  const finishedGoods = products.filter(p => p.type === 'FINISHED_GOOD')
  
  const lowStockCount = products.filter(isLowStock).length
  const totalValue = products.reduce((acc: number, p: Product) => acc + (p.price * p.stock), 0)

  // Handle header action button depending on active tab
  const handleHeaderAdd = () => {
    if (activeTab === 'STANDARD') {
      setIsAddReadyMadeOpen(true)
    } else if (activeTab === 'RAW_MATERIAL') {
      setIsAddRawMaterialOpen(true)
    } else if (activeTab === 'FINISHED_GOOD') {
      setIsAddItemWeMakeOpen(true)
    } else {
      setIsQuickAddModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Page Header */}
      <div className="px-4 sm:px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Inventory & Catalog
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ready-made stock, tailoring designs & raw materials
            </p>
          </div>

          {/* Dynamic Tab Action Button */}
          <button
            onClick={handleHeaderAdd}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
              activeTab === 'STANDARD'
                ? 'bg-blue-600 hover:bg-blue-700'
                : activeTab === 'RAW_MATERIAL'
                ? 'bg-amber-600 hover:bg-amber-700'
                : activeTab === 'FINISHED_GOOD'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'STANDARD'
                ? '+ Ready-Made'
                : activeTab === 'RAW_MATERIAL'
                ? '+ Raw Material'
                : activeTab === 'FINISHED_GOOD'
                ? '+ Item We Make'
                : '+ Add Item'}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product, material name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-foreground placeholder-muted-foreground transition-all"
          />
        </div>

        {/* Category Tabs (4 distinct options) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            All ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('STANDARD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'STANDARD'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            🛍️ Ready-Made ({readyMadeItems.length})
          </button>

          <button
            onClick={() => setActiveTab('RAW_MATERIAL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'RAW_MATERIAL'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            🧵 Raw Materials ({rawMaterials.length})
          </button>

          <button
            onClick={() => setActiveTab('FINISHED_GOOD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'FINISHED_GOOD'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            👗 Items We Make ({finishedGoods.length})
          </button>
        </div>

        {/* 4-Metric Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div className="bg-background rounded-xl p-3 border border-border shadow-xs">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Value</p>
            <p className="text-base font-extrabold text-foreground mt-0.5">₹{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border shadow-xs">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Ready-Made</p>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{readyMadeItems.length} items</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border shadow-xs">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Raw Materials</p>
            <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{rawMaterials.length} items</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border shadow-xs">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Items We Make</p>
            <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{finishedGoods.length} designs</p>
          </div>
        </div>

        {/* Low Stock Alerts Banner */}
        {lowStockCount > 0 && (
          <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-destructive">
                  Low Stock Warning ({lowStockCount} item{lowStockCount > 1 ? 's' : ''})
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold">Replenish Needed</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {products.filter(isLowStock).map((p: Product) => (
                  <span
                    key={p.id}
                    className="bg-card text-foreground text-[11px] px-2.5 py-1 rounded-lg border border-destructive/30 font-medium inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{p.name}:</span>
                    <strong className="text-destructive font-bold">{p.stock} {p.unit || 'pcs'}</strong>
                    <span className="text-muted-foreground text-[10px]">(min {p.lowStockThreshold ?? 5})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product List with Generous Spacing */}
      <div className="px-4 sm:px-6 py-5 space-y-3.5 max-w-4xl mx-auto">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const low = isLowStock(product)
            const isReadyMade = product.type === 'STANDARD'
            const isRaw = product.type === 'RAW_MATERIAL'
            const isFinished = product.type === 'FINISHED_GOOD'

            return (
              <div
                key={product.id}
                className={`bg-card border rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md ${
                  isReadyMade
                    ? 'border-blue-500/25 hover:border-blue-500/50'
                    : isRaw 
                    ? 'border-amber-500/25 hover:border-amber-500/50' 
                    : isFinished 
                    ? 'border-purple-500/25 hover:border-purple-500/50'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category Indicator Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isReadyMade
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : isRaw
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : isFinished
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isReadyMade ? (
                      <ShoppingBag className="w-5 h-5" />
                    ) : isRaw ? (
                      <Scissors className="w-5 h-5" />
                    ) : (
                      <Layers className="w-5 h-5" />
                    )}
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground text-sm sm:text-base truncate">
                            {product.name}
                          </h3>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              isReadyMade
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                : isRaw
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : isFinished
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isReadyMade ? '🛍️ Ready-Made' : isRaw ? '🧵 Raw Material' : '👗 Item We Make'}
                          </span>
                        </div>

                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {low && isRaw && (
                        <span className="shrink-0 px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded-full border border-destructive/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Needs Stock
                        </span>
                      )}
                    </div>

                    {/* Stock & Price Rows */}
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[11px] font-medium">
                          {isRaw ? `Purchase Cost / ${product.unit || 'unit'}` : 'Selling Price'}
                        </span>
                        <p className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                          ₹{product.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-muted-foreground text-[11px] font-medium">
                          {isRaw ? 'Available Stock' : isReadyMade ? 'Stock on Rack' : 'Ready in Workshop'}
                        </span>
                        <p className={`text-sm sm:text-base font-extrabold mt-0.5 ${low && (isRaw || isReadyMade) ? 'text-destructive' : 'text-foreground'}`}>
                          {product.stock} {product.unit || 'pcs'}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions / Metadata */}
                    <div className="flex items-center justify-between mt-3 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3 text-[11px]">
                        {product.dimensions && <span>Size: <strong className="text-foreground">{product.dimensions}</strong></span>}
                        {product.sku && <span>SKU: <strong className="text-foreground">{product.sku}</strong></span>}
                      </div>

                      {isFinished && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBOMProduct(product)
                            setIsBOMDrawerOpen(true)
                          }}
                          className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
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
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl p-6">
            <p className="text-sm font-bold text-foreground">No items in this category</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {activeTab === 'STANDARD'
                ? 'Add ready-made apparel (shirts, jeans, accessories) to sell off-the-rack.'
                : activeTab === 'RAW_MATERIAL'
                ? 'Add fabric, buttons, and zippers for manufacturing.'
                : activeTab === 'FINISHED_GOOD'
                ? 'Add custom garments (Kurta, Suit, Pant) that you tailor.'
                : 'No items match your search.'}
            </p>
            <button
              onClick={handleHeaderAdd}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={() => setIsQuickAddModalOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-xl z-30"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Quick Add Selection Sheet (Opens from FAB or header) */}
      <AnimatePresence>
        {isQuickAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setIsQuickAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-28 sm:w-96 bg-card border border-border rounded-3xl p-5 shadow-2xl z-50 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">What do you want to add?</h3>
                  <p className="text-xs text-muted-foreground">Select an inventory category</p>
                </div>
                <button
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {/* Ready-Made */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddModalOpen(false)
                    setIsAddReadyMadeOpen(true)
                  }}
                  className="w-full p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">🛍️ Ready-Made Garment</p>
                      <p className="text-[11px] text-muted-foreground">Direct retail item (Shirt, Jeans, Belt)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Raw Material */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddModalOpen(false)
                    setIsAddRawMaterialOpen(true)
                  }}
                  className="w-full p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">🧵 Raw Material</p>
                      <p className="text-[11px] text-muted-foreground">Fabric, cloth in meters, buttons, zips</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Item We Make */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddModalOpen(false)
                    setIsAddItemWeMakeOpen(true)
                  }}
                  className="w-full p-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">👗 Item We Make</p>
                      <p className="text-[11px] text-muted-foreground">Design template with recipe (Kurta, Suit)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drawers */}
      <AddReadyMadeDrawer
        isOpen={isAddReadyMadeOpen}
        onClose={() => setIsAddReadyMadeOpen(false)}
      />

      <AddRawMaterialDrawer
        isOpen={isAddRawMaterialOpen}
        onClose={() => setIsAddRawMaterialOpen(false)}
      />

      <AddItemWeMakeDrawer
        isOpen={isAddItemWeMakeOpen}
        onClose={() => setIsAddItemWeMakeOpen(false)}
      />

      <BOMDrawer 
        isOpen={isBOMDrawerOpen} 
        onClose={() => setIsBOMDrawerOpen(false)} 
        product={selectedBOMProduct} 
      />
    </div>
  )
}
