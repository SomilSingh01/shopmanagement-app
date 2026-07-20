import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
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
      toast.success('Raw material added to recipe')
      setSelectedRawMaterial('')
      setQuantity('1')
    },
    onError: () => toast.error('Failed to add raw material')
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-card shadow-2xl border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Bill of Materials</h2>
                <p className="text-sm text-muted-foreground">Recipe for {product.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Add New Item */}
              <div className="bg-muted p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Add Raw Material</h3>
                <div className="space-y-2">
                  <CustomSelect
                    value={selectedRawMaterial}
                    onChange={(val) => setSelectedRawMaterial(val)}
                    placeholder="Select Raw Material..."
                    options={rawMaterials.map((rm: Product) => ({
                      value: rm.id,
                      label: `${rm.name} (In stock: ${rm.stock})`
                    }))}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Quantity required"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button
                      onClick={handleAdd}
                      disabled={addBOMMutation.isPending}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Recipe */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Current Recipe (per 1 unit)</h3>
                
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading recipe...</p>
                ) : bomItems?.length === 0 ? (
                  <div className="text-center py-8 bg-background border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">No raw materials defined.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bomItems?.map((item: BOMItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.rawMaterial?.name}</p>
                          <p className="text-xs text-muted-foreground">Requires: {item.quantity} units</p>
                        </div>
                        <button
                          onClick={() => removeBOMMutation.mutate(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
