import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Layers, IndianRupee } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface AddProductDrawerProps {
  isOpen: boolean
  onClose: () => void
  defaultType?: 'STANDARD' | 'RAW_MATERIAL' | 'FINISHED_GOOD'
}

interface RecipeItemDraft {
  rawMaterialId: string
  name: string
  unit: string
  unitCost: number
  quantity: number
}

export const AddProductDrawer: React.FC<AddProductDrawerProps> = ({ 
  isOpen, 
  onClose,
  defaultType = 'STANDARD'
}) => {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    lowStockThreshold: '5',
    type: defaultType,
    unit: 'pcs',
    sku: '',
    dimensions: ''
  })

  // BOM recipe items draft for Finished Goods
  const [recipeItems, setRecipeItems] = useState<RecipeItemDraft[]>([])
  const [selectedRmId, setSelectedRmId] = useState('')
  const [rmQty, setRmQty] = useState('1')

  // Fetch products to get Raw Materials for BOM recipe
  const { data: allProductsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    enabled: isOpen
  })
  const allProducts: Product[] = allProductsData?.data || allProductsData || []
  const rawMaterials = allProducts.filter((p: Product) => p.type === 'RAW_MATERIAL')

  // Reset or set defaults when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        lowStockThreshold: '5',
        type: defaultType,
        unit: defaultType === 'RAW_MATERIAL' ? 'meters' : 'pcs',
        sku: '',
        dimensions: ''
      })
      setRecipeItems([])
      setSelectedRmId('')
      setRmQty('1')
    }
  }, [isOpen, defaultType])

  // Calculate live BOM Material Cost
  const totalMaterialCost = recipeItems.reduce(
    (sum, item) => sum + (item.unitCost * item.quantity), 
    0
  )

  const sellingPrice = Number(formData.price) || 0
  const grossMargin = sellingPrice > 0 ? sellingPrice - totalMaterialCost : 0
  const grossMarginPercent = sellingPrice > 0 ? ((grossMargin / sellingPrice) * 100).toFixed(1) : '0'

  // Add ingredient to recipe list
  const handleAddRecipeItem = () => {
    if (!selectedRmId) {
      toast.error('Select a raw material first')
      return
    }
    const qtyNum = parseFloat(rmQty)
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    const rm = rawMaterials.find(r => r.id === selectedRmId)
    if (!rm) return

    // If already in list, update quantity
    const existingIndex = recipeItems.findIndex(i => i.rawMaterialId === selectedRmId)
    if (existingIndex > -1) {
      const updated = [...recipeItems]
      updated[existingIndex].quantity += qtyNum
      setRecipeItems(updated)
    } else {
      setRecipeItems([
        ...recipeItems,
        {
          rawMaterialId: rm.id,
          name: rm.name,
          unit: rm.unit || 'units',
          unitCost: rm.price,
          quantity: qtyNum
        }
      ])
    }

    setSelectedRmId('')
    setRmQty('1')
  }

  const handleRemoveRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index))
  }

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Create the Product
      const product = await apiClient.createProduct(data)
      const productId = product?.id || product?.data?.id

      // 2. If it's a Finished Good and user defined recipe items, save each BOM Item
      if (productId && data.type === 'FINISHED_GOOD' && recipeItems.length > 0) {
        await Promise.all(
          recipeItems.map(item =>
            apiClient.addBOMItem(productId, {
              rawMaterialId: item.rawMaterialId,
              quantity: item.quantity
            })
          )
        )
      }
      return product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['bom'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success(
        formData.type === 'FINISHED_GOOD' && recipeItems.length > 0
          ? 'Item created with Bill of Materials recipe!'
          : 'Item added successfully!'
      )
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.price) {
      toast.error('Please enter Item Name and Price')
      return
    }
    
    createProductMutation.mutate({
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      type: formData.type,
      price: Number(formData.price),
      stock: formData.stock ? Number(formData.stock) : 0,
      lowStockThreshold: formData.lowStockThreshold ? Number(formData.lowStockThreshold) : 5,
      unit: formData.unit,
      sku: formData.sku?.trim() || undefined,
      dimensions: formData.dimensions?.trim() || undefined
    })
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-card shadow-2xl border-l border-border z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {formData.type === 'FINISHED_GOOD' 
                    ? 'Add Garment to Make (Finished Good)' 
                    : formData.type === 'RAW_MATERIAL' 
                    ? 'Add Raw Material' 
                    : 'Add New Product'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {formData.type === 'FINISHED_GOOD'
                    ? 'Define garment specs & raw material recipe (BOM)'
                    : formData.type === 'RAW_MATERIAL'
                    ? 'Cloth, buttons, zips & accessories used in production'
                    : 'Standard retail or inventory product'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Product Type Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Item Classification *
                </label>
                <CustomSelect
                  value={formData.type}
                  onChange={(val) => {
                    setFormData({ 
                      ...formData, 
                      type: val,
                      unit: val === 'RAW_MATERIAL' && formData.unit === 'pcs' ? 'meters' : formData.unit
                    })
                  }}
                  options={[
                    { value: 'FINISHED_GOOD', label: '👗 Finished Good (e.g. Kurta, Suit, Pant, Shirt)' },
                    { value: 'RAW_MATERIAL', label: '🧵 Raw Material (e.g. Fabric, Buttons, Zippers, Thread)' },
                    { value: 'STANDARD', label: '📦 Standard Retail Item' }
                  ]}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {formData.type === 'FINISHED_GOOD' ? 'Garment Name *' : formData.type === 'RAW_MATERIAL' ? 'Material Name *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    formData.type === 'FINISHED_GOOD' 
                      ? 'e.g. Cotton Kurta, Formal Pant, Silk Suit' 
                      : formData.type === 'RAW_MATERIAL'
                      ? 'e.g. Pure Cotton Fabric, Metallic Buttons, Brass Zip'
                      : 'e.g. Readymade Belt'
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Unit of Measurement */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Unit of Measurement *</label>
                <CustomSelect
                  value={formData.unit}
                  onChange={(val) => setFormData({ ...formData, unit: val })}
                  options={[
                    { value: 'pcs', label: 'Pieces (pcs)' },
                    { value: 'meters', label: 'Meters (m)' },
                    { value: 'cm', label: 'Centimeters (cm)' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                    { value: 'g', label: 'Grams (g)' },
                    { value: 'spools', label: 'Spools / Reels' },
                    { value: 'box', label: 'Boxes' }
                  ]}
                />
              </div>

              {/* Stock and Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {formData.type === 'RAW_MATERIAL' 
                      ? `Stock (${formData.unit})` 
                      : `Initial Stock (${formData.unit})`}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder={formData.type === 'RAW_MATERIAL' ? 'e.g. 100' : '0'}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {formData.type === 'RAW_MATERIAL' 
                      ? `Cost per ${formData.unit} (₹) *` 
                      : 'Selling Price (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* INLINE BOM RECIPE BUILDER FOR FINISHED GOODS */}
              {formData.type === 'FINISHED_GOOD' && (
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" />
                      Recipe / BOM (Raw Materials Required)
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">Per 1 Garment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Specify the materials (cloth, buttons, zip, etc.) consumed to produce 1 unit of this {formData.name || 'item'}.
                  </p>

                  {/* Add Raw Material Row */}
                  <div className="space-y-2 bg-background p-3 rounded-lg border border-border">
                    <CustomSelect
                      value={selectedRmId}
                      onChange={(val) => setSelectedRmId(val)}
                      placeholder="Select Raw Material..."
                      options={rawMaterials.map((rm) => ({
                        value: rm.id,
                        label: `${rm.name} (₹${rm.price}/${rm.unit || 'units'} · Stock: ${rm.stock} ${rm.unit || ''})`
                      }))}
                    />

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Qty per 1 unit"
                        value={rmQty}
                        onChange={(e) => setRmQty(e.target.value)}
                        className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddRecipeItem}
                        className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Material
                      </button>
                    </div>

                    {rawMaterials.length === 0 && (
                      <p className="text-[11px] text-amber-500 font-medium">
                        ⚠️ No raw materials found in inventory. You can create raw materials (Cloth, Buttons) first, or add this recipe later.
                      </p>
                    )}
                  </div>

                  {/* Added Recipe Items List */}
                  {recipeItems.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-foreground">Added Ingredients:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {recipeItems.map((item, index) => {
                          const itemTotalCost = item.unitCost * item.quantity
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-card border border-border px-2.5 py-1.5 rounded-md text-xs"
                            >
                              <div>
                                <span className="font-semibold text-foreground">{item.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  {item.quantity} {item.unit} × ₹{item.unitCost} = 
                                  <strong className="text-foreground ml-1">₹{itemTotalCost.toFixed(2)}</strong>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeItem(index)}
                                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Cost & Margin Summary */}
                      <div className="bg-card border border-border p-2.5 rounded-lg text-xs space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Material Cost:</span>
                          <span className="font-bold text-foreground">₹{totalMaterialCost.toFixed(2)}</span>
                        </div>
                        {sellingPrice > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Selling Price:</span>
                              <span className="font-semibold text-foreground">₹{sellingPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-1 font-semibold">
                              <span className="text-success">Projected Margin:</span>
                              <span className={grossMargin >= 0 ? 'text-success' : 'text-destructive'}>
                                ₹{grossMargin.toFixed(2)} ({grossMarginPercent}%)
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Low Stock Alert Threshold ({formData.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  placeholder="5"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* SKU & Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. KRT-SILK-01"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Dimensions / Size</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g. M / L / XL"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes / Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-[60px]"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={createProductMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createProductMutation.isPending 
                  ? 'Saving Item & Recipe...' 
                  : formData.type === 'FINISHED_GOOD' 
                  ? 'Save Garment & Recipe' 
                  : 'Save Item'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
