import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Product, BOMItem } from '@/types'
import { Factory, PlayCircle, CheckCircle, AlertTriangle, IndianRupee, Plus, Layers, ArrowRight, Trash2, Sparkles, ChevronDown, Search, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { AddItemWeMakeDrawer } from '@/components/inventory/AddItemWeMakeDrawer'
import { AddRawMaterialDrawer } from '@/components/inventory/AddRawMaterialDrawer'
import { BOMDrawer } from '@/components/inventory/BOMDrawer'

interface EditableRunMaterial {
  id: string
  rawMaterialId?: string
  name: string
  unit: string
  unitCost: number
  quantityPerUnit: number
  isCustom?: boolean
}

const EMPTY_BOM: BOMItem[] = []

export default function ManufacturingPage() {
  const queryClient = useQueryClient()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [garmentSearch, setGarmentSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [batchQuantity, setBatchQuantity] = useState('1')
  const [customSellingPrice, setCustomSellingPrice] = useState<string>('')
  
  // Custom Materials / Add-ons for this specific run
  const [runMaterials, setRunMaterials] = useState<EditableRunMaterial[]>([])
  
  // Quick Add-on form state
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [customItemUnit, setCustomItemUnit] = useState('pcs')
  const [customItemQty, setCustomItemQty] = useState('1')
  const [customItemCost, setCustomItemCost] = useState('')

  // Drawers
  const [isAddItemWeMakeOpen, setIsAddItemWeMakeOpen] = useState(false)
  const [isAddRawMaterialOpen, setIsAddRawMaterialOpen] = useState(false)
  const [stockingMaterialName, setStockingMaterialName] = useState('')
  const [stockingMaterialUnit, setStockingMaterialUnit] = useState('meters')
  const [isBOMDrawerOpen, setIsBOMDrawerOpen] = useState(false)

  // Fetch all products to get Finished Goods & Raw Materials
  const { data: allProductsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  })
  const allProducts: Product[] = allProductsData?.data || allProductsData || []
  const finishedGoods = allProducts.filter((p: Product) => p.type === 'FINISHED_GOOD')
  const selectedProductObj = finishedGoods.find((p: Product) => p.id === selectedProductId)

  // Filter finished goods by search query
  const filteredGarments = useMemo(() => {
    if (!garmentSearch.trim()) return finishedGoods
    return finishedGoods.filter(g => g.name.toLowerCase().includes(garmentSearch.toLowerCase()))
  }, [finishedGoods, garmentSearch])

  // Fetch standard BOM for selected product
  const { data: bomData, isLoading: bomLoading } = useQuery({
    queryKey: ['bom', selectedProductId],
    queryFn: () => apiClient.getBOM(selectedProductId),
    enabled: !!selectedProductId
  })
  
  const defaultBOMItems: BOMItem[] = useMemo(() => {
    if (!bomData) return EMPTY_BOM
    return Array.isArray(bomData) ? bomData : bomData?.data || EMPTY_BOM
  }, [bomData])

  // When selectedProductId or defaultBOMItems changes, initialize the editable run materials & selling price
  useEffect(() => {
    if (!selectedProductId) {
      setCustomSellingPrice('')
      setRunMaterials(prev => prev.length === 0 ? prev : [])
      return
    }

    if (selectedProductObj) {
      setCustomSellingPrice(selectedProductObj.price.toString())
    }

    if (defaultBOMItems && defaultBOMItems.length > 0) {
      const initialMaterials: EditableRunMaterial[] = defaultBOMItems.map((item) => {
        const rm = allProducts.find(p => p.id === item.rawMaterialId) || item.rawMaterial
        return {
          id: item.id,
          rawMaterialId: item.rawMaterialId,
          name: rm?.name || 'Raw Material',
          unit: rm?.unit || 'units',
          unitCost: rm?.price || 0,
          quantityPerUnit: item.quantity,
          isCustom: false
        }
      })
      setRunMaterials(initialMaterials)
    } else {
      setRunMaterials(prev => prev.length === 0 ? prev : [])
    }
  }, [selectedProductId, selectedProductObj?.price, defaultBOMItems, allProducts])

  // Fetch Active Manufacturing Orders
  const { data: mfgOrders, isLoading: mfgLoading } = useQuery({
    queryKey: ['manufacturing-orders'],
    queryFn: () => apiClient.getManufacturingOrders(),
  })

  // Handlers for modifying the run's materials
  const handleUpdateMaterialQty = (id: string, newQty: number) => {
    setRunMaterials(prev =>
      prev.map(item => item.id === id ? { ...item, quantityPerUnit: Math.max(0, newQty) } : item)
    )
  }

  const handleUpdateMaterialRate = (id: string, newRate: number) => {
    setRunMaterials(prev =>
      prev.map(item => item.id === id ? { ...item, unitCost: Math.max(0, newRate) } : item)
    )
  }

  const handleRemoveMaterial = (id: string) => {
    setRunMaterials(prev => prev.filter(item => item.id !== id))
  }

  const handleAddCustomAddon = () => {
    if (!customItemName.trim()) {
      toast.error('Please enter the accessory name (e.g. Stones, Lace)')
      return
    }
    const qty = parseFloat(customItemQty)
    const cost = parseFloat(customItemCost)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    if (isNaN(cost) || cost < 0) {
      toast.error('Please enter a valid rate (₹)')
      return
    }

    const newItem: EditableRunMaterial = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      unit: customItemUnit,
      unitCost: cost,
      quantityPerUnit: qty,
      isCustom: true
    }

    setRunMaterials(prev => [...prev, newItem])
    setCustomItemName('')
    setCustomItemQty('1')
    setCustomItemCost('')
    setIsAddingCustomItem(false)
    toast.success(`Added "${newItem.name}" to this run calculation!`)
  }

  const handleOpenStockMaterial = (name: string, unit: string) => {
    setStockingMaterialName(name)
    setStockingMaterialUnit(unit)
    setIsAddRawMaterialOpen(true)
  }

  // Calculate live financial numbers
  const batchQty = Math.max(1, Number(batchQuantity) || 1)
  
  const materialCostPerUnit = runMaterials.reduce((acc, item) => {
    return acc + (item.unitCost * item.quantityPerUnit)
  }, 0)

  const totalBatchMaterialCost = materialCostPerUnit * batchQty
  const sellingPricePerUnit = parseFloat(customSellingPrice) || 0
  const grossProfitPerUnit = sellingPricePerUnit - materialCostPerUnit
  const grossProfitMargin = sellingPricePerUnit > 0 ? ((grossProfitPerUnit / sellingPricePerUnit) * 100).toFixed(1) : '0'
  const totalBatchRevenue = sellingPricePerUnit * batchQty
  const totalBatchProfit = totalBatchRevenue - totalBatchMaterialCost

  // Inventory check for each material
  const materialInventoryCheck = useMemo(() => {
    return runMaterials.map(item => {
      const rm = allProducts.find(p => p.id === item.rawMaterialId) || 
        allProducts.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase() && p.type === 'RAW_MATERIAL')
      
      const inStock = rm ? rm.stock : 0
      const isUnstocked = !rm || rm.stock <= 0
      return {
        ...item,
        inStock,
        isUnstocked,
        inventoryProduct: rm
      }
    })
  }, [runMaterials, allProducts])

  const unstockedMaterials = materialInventoryCheck.filter(m => m.isUnstocked && !m.isCustom)

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      apiClient.createManufacturingOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      toast.success('Production run created successfully!')
      setSelectedProductId('')
      setGarmentSearch('')
      setBatchQuantity('1')
      setRunMaterials([])
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create run')
  })

  const completeOrderMutation = useMutation({
    mutationFn: (id: string) => apiClient.completeManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success('Production completed! Stock updated.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to execute run')
    }
  })

  const handleCreateRun = () => {
    if (!selectedProductId) {
      toast.error('Please select what you want to make')
      return
    }
    if (batchQty <= 0) {
      toast.error('Please enter a valid batch quantity')
      return
    }
    createOrderMutation.mutate({
      productId: selectedProductId,
      quantity: batchQty
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Page Header */}
      <div className="px-4 py-4 border-b border-border bg-card">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          Manufacturing & Tailoring
        </h1>
        <p className="text-xs text-muted-foreground">
          Select what you want to make, customize materials & accessories per client, and calculate exact profit margins.
        </p>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What to make & Run customization */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-card border border-border p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="text-base font-bold text-foreground">What Do You Want to Make?</h2>
              <button
                type="button"
                onClick={() => setIsAddItemWeMakeOpen(true)}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 py-1 px-2 rounded-md hover:bg-purple-500/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> + New Item We Make
              </button>
            </div>

            {/* Clean Dropdown with Search & Typing Option */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item to Make (e.g. Kurta, Pant, Shirt, Suit) *
              </label>
              
              <div className="relative">
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-primary"
                >
                  <span className={selectedProductObj ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                    {selectedProductObj ? selectedProductObj.name : 'Choose an item to make...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
                    >
                      {/* Search / Type input inside dropdown */}
                      <div className="p-2 border-b border-border bg-muted/40 flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          value={garmentSearch}
                          onChange={(e) => setGarmentSearch(e.target.value)}
                          placeholder="Type item name..."
                          className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder-muted-foreground"
                          autoFocus
                        />
                      </div>

                      {/* Clean Options List - Only Names! */}
                      <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/40">
                        {filteredGarments.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-2">No item found named "{garmentSearch}"</p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDropdownOpen(false)
                                setIsAddItemWeMakeOpen(true)
                              }}
                              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              + Add "{garmentSearch || 'New Garment'}" to items we make
                            </button>
                          </div>
                        ) : (
                          filteredGarments.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(g.id)
                                setIsDropdownOpen(false)
                                setGarmentSearch('')
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                                selectedProductId === g.id
                                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold'
                                  : 'text-foreground hover:bg-muted'
                              }`}
                            >
                              <span className="font-semibold">{g.name}</span>
                              <span className="text-[11px] text-muted-foreground">Base: ₹{g.price}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Batch Quantity & Editable Selling Price Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Batch Quantity (Pieces) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Selling Price per Unit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={customSellingPrice}
                  onChange={(e) => setCustomSellingPrice(e.target.value)}
                  placeholder="e.g. 999"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Editable for discounts/custom rates</p>
              </div>
            </div>

            {/* Unstocked Materials Reminder Banner */}
            {selectedProductObj && unstockedMaterials.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    Inventory Stock Reminder ({unstockedMaterials.length} item{unstockedMaterials.length > 1 ? 's' : ''}):
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {unstockedMaterials.map(m => m.name).join(', ')} {unstockedMaterials.length > 1 ? 'are' : 'is'} not currently stocked in your raw materials inventory. Use the <strong>[ + Stock Material ]</strong> button on each row to record your purchase.
                  </p>
                </div>
              </div>
            )}

            {/* INLINE RECIPE & LIVE BOM CUSTOMIZATION */}
            {selectedProductObj && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Materials & Accessories for {selectedProductObj.name}
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Per 1 Piece</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Default recipe loaded. You can <strong>edit quantities</strong> or <strong>add custom items (stones, lace)</strong> for this run.
                </p>

                {/* Materials List */}
                <div className="space-y-2.5">
                  {materialInventoryCheck.length === 0 ? (
                    <div className="p-4 bg-muted/40 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                      No materials configured for this item yet. Use the button below to add cloth, buttons, or custom accessories.
                    </div>
                  ) : (
                    materialInventoryCheck.map((item) => {
                      const itemTotalUnitCost = item.unitCost * item.quantityPerUnit
                      const itemBatchCost = itemTotalUnitCost * batchQty

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                            item.isCustom
                              ? 'bg-purple-500/5 border-purple-500/30'
                              : 'bg-background border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground text-sm">{item.name}</span>
                                {item.isCustom && (
                                  <span className="px-1.5 py-0.2 bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] rounded font-semibold flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> Custom Add-on
                                  </span>
                                )}
                              </div>

                              {/* Inventory Reminder Badge */}
                              {!item.isCustom && item.isUnstocked && (
                                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                                  <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Not stocked (0 in stock)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStockMaterial(item.name, item.unit)}
                                    className="text-primary font-bold hover:underline"
                                  >
                                    [ + Stock Material ]
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(item.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              title="Remove from this run"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editable Quantity & Rate Formula */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground text-[11px]">Qty per 1 pc:</span>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantityPerUnit}
                                onChange={(e) => handleUpdateMaterialQty(item.id, parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-card border border-border rounded text-xs font-bold text-foreground focus:ring-1 focus:ring-primary text-center"
                              />
                              <span className="text-muted-foreground text-[11px] font-medium">{item.unit}</span>
                              <span className="text-muted-foreground text-[11px]">× ₹</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitCost}
                                onChange={(e) => handleUpdateMaterialRate(item.id, parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 bg-card border border-border rounded text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                                placeholder="rate"
                              />
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-foreground">
                                ₹{itemTotalUnitCost.toFixed(2)}/pc
                              </span>
                              {batchQty > 1 && (
                                <span className="text-[10px] text-muted-foreground block">
                                  Batch: ₹{itemBatchCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Add Custom Add-on Button / Form */}
                {!isAddingCustomItem ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomItem(true)}
                    className="w-full py-2 border border-dashed border-purple-500/40 hover:border-purple-500 bg-purple-500/5 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Custom Material / Add-on (e.g. Stones, Lace, Zips)</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Custom One-Off Add-on
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomItem(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Embroidery Stones, Golden Lace, Collar)"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Quantity per pc</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            placeholder="e.g. 50"
                            value={customItemQty}
                            onChange={(e) => setCustomItemQty(e.target.value)}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Unit</label>
                          <select
                            value={customItemUnit}
                            onChange={(e) => setCustomItemUnit(e.target.value)}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary"
                          >
                            <option value="pcs">pcs</option>
                            <option value="meters">meters</option>
                            <option value="cm">cm</option>
                            <option value="spools">spools</option>
                            <option value="g">grams</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Rate (₹ per unit)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="e.g. 3"
                            value={customItemCost}
                            onChange={(e) => setCustomItemCost(e.target.value)}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomAddon}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Add to This Run Calculation
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <button
              onClick={handleCreateRun}
              disabled={createOrderMutation.isPending || !selectedProductId}
              className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>{createOrderMutation.isPending ? 'Planning Run...' : 'Start Production Run'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Live BOM Calculation & Active Production Runs */}
        <div className="lg:col-span-6 space-y-5">
          {/* Live BOM & Profitability Card */}
          {selectedProductObj && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-card border border-border p-4 sm:p-5 rounded-xl shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-500" />
                  Live BOM Cost & Profit Calculation
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  Batch: {batchQty} pc{batchQty > 1 ? 's' : ''}
                </span>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                    Material Cost Formula (Quantity × Rate)
                  </p>
                  {materialInventoryCheck.length === 0 ? (
                    <p className="text-muted-foreground">Add materials above to calculate BOM cost.</p>
                  ) : (
                    materialInventoryCheck.map((m) => (
                      <div key={m.id} className="flex justify-between items-center text-muted-foreground">
                        <span>
                          {m.name} ({m.quantityPerUnit} {m.unit} × ₹{m.unitCost}):
                        </span>
                        <strong className="text-foreground">₹{(m.quantityPerUnit * m.unitCost).toFixed(2)}</strong>
                      </div>
                    ))
                  )}
                  <div className="border-t border-border pt-1 flex justify-between font-bold text-foreground">
                    <span>Total Material Cost per {selectedProductObj.name}:</span>
                    <span className="text-sm">₹{materialCostPerUnit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Selling Price & Margin Comparison */}
                <div className="pt-2 border-t border-border space-y-1.5">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Your Selling Price (per piece):</span>
                    <strong className="text-foreground text-sm">₹{sellingPricePerUnit.toFixed(2)}</strong>
                  </div>

                  <div className="flex justify-between items-center font-bold pt-1 border-t border-border">
                    <span className="text-emerald-600 dark:text-emerald-400">Profit Margin per Piece:</span>
                    <span className={`text-sm ${grossProfitPerUnit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      ₹{grossProfitPerUnit.toFixed(2)} ({grossProfitMargin}%)
                    </span>
                  </div>
                </div>

                {/* Batch Totals */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg space-y-1 pt-2">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Total Batch Material Cost ({batchQty} pcs):</span>
                    <strong className="text-foreground">₹{totalBatchMaterialCost.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Total Expected Batch Revenue:</span>
                    <strong className="text-foreground">₹{totalBatchRevenue.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-extrabold text-sm pt-1 border-t border-emerald-500/20">
                    <span>Total Projected Profit:</span>
                    <span>₹{totalBatchProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Production Runs List */}
          <div className="bg-card border border-border p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
              <h2 className="text-base font-bold text-foreground">Active Production Runs</h2>
              <span className="text-xs text-muted-foreground">Execution & Stock update</span>
            </div>

            {mfgLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Loading production runs...</p>
            ) : !mfgOrders || mfgOrders.length === 0 ? (
              <div className="text-center py-8 bg-background border border-dashed border-border rounded-xl">
                <Factory className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-foreground">No production runs active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Select an item on the left to start a batch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mfgOrders.map((order: any) => (
                  <div key={order.id} className="p-3.5 border border-border rounded-xl bg-background flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground text-sm truncate">{order.product?.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'COMPLETED' 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-primary/15 text-primary'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Batch: <strong className="text-foreground">{order.quantity} pcs</strong> • Planned: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'PLANNED' && (
                        <button
                          onClick={() => completeOrderMutation.mutate(order.id)}
                          disabled={completeOrderMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Complete Run
                        </button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-xs px-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Stock Added</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawers */}
      <AddItemWeMakeDrawer
        isOpen={isAddItemWeMakeOpen}
        onClose={() => setIsAddItemWeMakeOpen(false)}
      />
      
      <AddRawMaterialDrawer
        isOpen={isAddRawMaterialOpen}
        onClose={() => setIsAddRawMaterialOpen(false)}
        initialName={stockingMaterialName}
        initialUnit={stockingMaterialUnit}
      />

      <BOMDrawer
        isOpen={isBOMDrawerOpen}
        onClose={() => setIsBOMDrawerOpen(false)}
        product={selectedProductObj || null}
      />
    </div>
  )
}
