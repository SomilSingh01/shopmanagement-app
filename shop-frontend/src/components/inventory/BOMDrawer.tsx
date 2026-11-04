import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Layers, IndianRupee } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { apiClient } from '@/lib/api'
import type { Product, BOMItem } from '@/types'
import toast from 'react-hot-toast'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface BOMDrawerProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export const BOMDrawer: React.FC<BOMDrawerProps> = ({ isOpen, onClose, product }) => {
  const queryClient = useQueryClient()
  const [selectedRawMaterial, setSelectedRawMaterial] = useState('')
  const [quantity, setQuantity] = useState('1')

  // Fetch all products to find Raw Materials
  const { data: allProductsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    enabled: isOpen
  })
  const allProducts = allProductsData?.data || allProductsData || []
  const rawMaterials = allProducts.filter((p: Product) => p.type === 'RAW_MATERIAL')

  // Fetch BOM for this product
  const { data: bomItems, isLoading } = useQuery({
    queryKey: ['bom', product?.id],
    queryFn: () => apiClient.getBOM(product!.id),
    enabled: isOpen && !!product?.id
  })

  const addBOMMutation = useMutation({
    mutationFn: (data: { rawMaterialId: string; quantity: number }) =>
      apiClient.addBOMItem(product!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', product?.id] })
      toast.success('Material added to recipe')
      setSelectedRawMaterial('')
      setQuantity('1')
    },
    onError: () => toast.error('Failed to add material')
  })

  const removeBOMMutation = useMutation({
    mutationFn: (id: string) => apiClient.removeBOMItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', product?.id] })
      toast.success('Removed from recipe')
    },
    onError: () => toast.error('Failed to remove item')
  })

  const handleAdd = () => {
    if (!selectedRawMaterial || !quantity || Number(quantity) <= 0) {
      toast.error('Please select a material and valid quantity')
      return
    }
    addBOMMutation.mutate({
      rawMaterialId: selectedRawMaterial,
      quantity: Number(quantity)
    })
  }

  // Calculate live recipe costs
  const totalRecipeCost = (bomItems || []).reduce((sum: number, item: BOMItem) => {
    const rm = allProducts.find((p: Product) => p.id === item.rawMaterialId) || item.rawMaterial
    const cost = rm ? rm.price * item.quantity : 0
    return sum + cost
  }, 0)

  const sellingPrice = product?.price || 0
  const margin = sellingPrice - totalRecipeCost
  const marginPercent = sellingPrice > 0 ? ((margin / sellingPrice) * 100).toFixed(1) : '0'

  const modalContent = (
    <AnimatePresence>
      {isOpen && product && (
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
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-card shadow-2xl border-l border-border z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Bill of Materials (BOM)
                </h2>
                <p className="text-xs text-muted-foreground">Recipe & Material Cost for {product.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Add New Item */}
              <div className="bg-muted/60 border border-border p-3.5 rounded-xl space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  + Add Raw Material to Recipe
                </h3>
                <div className="space-y-2">
                  <CustomSelect
                    value={selectedRawMaterial}
                    onChange={(val) => setSelectedRawMaterial(val)}
                    placeholder="Select Raw Material (Cloth, Buttons, etc.)..."
                    options={rawMaterials.map((rm: Product) => ({
                      value: rm.id,
                      label: `${rm.name} (₹${rm.price}/${rm.unit || 'units'} · Stock: ${rm.stock} ${rm.unit || ''})`
                    }))}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty required per 1 piece"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button
                      onClick={handleAdd}
                      disabled={addBOMMutation.isPending}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Material
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Recipe */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Recipe Ingredients (per 1 unit)</h3>
                  <span className="text-xs text-muted-foreground">{bomItems?.length || 0} material(s)</span>
                </div>
                
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading recipe...</p>
                ) : !bomItems || bomItems.length === 0 ? (
                  <div className="text-center py-8 bg-background border border-dashed border-border rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground">No raw materials in recipe</p>
                    <p className="text-xs text-muted-foreground mt-1">Add cloth, buttons, zippers, or threads above to track production requirements.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bomItems.map((item: BOMItem) => {
                      const rm = allProducts.find((p: Product) => p.id === item.rawMaterialId) || item.rawMaterial
                      const itemCost = rm ? rm.price * item.quantity : 0
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{rm?.name || 'Unknown Material'}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {rm?.unit || 'units'} @ ₹{rm?.price || 0}/{rm?.unit || 'unit'} = 
                              <strong className="text-foreground ml-1">₹{itemCost.toFixed(2)}</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => removeBOMMutation.mutate(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Cost & Profitability Summary Card */}
              {bomItems && bomItems.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                    Unit Cost & Margin Breakdown
                  </h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Raw Material Cost:</span>
                    <span className="font-bold text-foreground">₹{totalRecipeCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Selling Price:</span>
                    <span className="font-semibold text-foreground">₹{sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-primary/20 pt-2 flex justify-between font-semibold text-sm">
                    <span>Gross Profit / Margin:</span>
                    <span className={margin >= 0 ? 'text-success' : 'text-destructive'}>
                      ₹{margin.toFixed(2)} ({marginPercent}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
