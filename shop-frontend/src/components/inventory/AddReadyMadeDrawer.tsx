import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, ShoppingBag, IndianRupee, Tag, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface AddReadyMadeDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const AddReadyMadeDrawer: React.FC<AddReadyMadeDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    sellingPrice: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '5',
    size: '',
    sku: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        sellingPrice: '',
        costPrice: '',
        stock: '',
        lowStockThreshold: '5',
        size: '',
        sku: '',
        notes: ''
      })
    }
  }, [isOpen])

  const selling = parseFloat(formData.sellingPrice) || 0
  const cost = parseFloat(formData.costPrice) || 0
  const margin = selling > 0 ? selling - cost : 0
  const marginPercent = selling > 0 ? ((margin / selling) * 100).toFixed(1) : '0'

  const createReadyMadeMutation = useMutation({
    mutationFn: (data: any) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success(`Ready-made item "${formData.name.trim()}" added to inventory!`)
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add item')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Please enter the product name')
      return
    }
    if (!formData.sellingPrice) {
      toast.error('Please enter the selling price')
      return
    }

    // Build description including cost info
    const costNote = formData.costPrice ? `Purchase Cost: ₹${formData.costPrice}` : ''
    const fullDescription = [costNote, formData.notes.trim()].filter(Boolean).join(' • ')

    createReadyMadeMutation.mutate({
      name: formData.name.trim(),
      type: 'STANDARD',
      price: Number(formData.sellingPrice),
      stock: formData.stock ? Number(formData.stock) : 0,
      lowStockThreshold: formData.lowStockThreshold ? Number(formData.lowStockThreshold) : 5,
      unit: 'pcs',
      dimensions: formData.size.trim() || undefined,
      sku: formData.sku?.trim() || undefined,
      description: fullDescription || undefined
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-card shadow-2xl border-l border-border z-[60] flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Add Ready-Made Item
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Off-the-rack garments ready to sell directly to customers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Readymade Formal Shirt, Cotton Jeans, Leather Belt"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Price & Cost Section */}
              <div className="border border-border rounded-2xl p-4 bg-muted/20 space-y-3.5">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Pricing & Cost
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Set retail selling price and purchase cost price
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Selling Price */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Selling Price (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Price customer pays</p>
                  </div>

                  {/* Cost Price */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Cost Price (₹) (optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">What you paid for it</p>
                  </div>
                </div>

                {/* Profit Margin Preview */}
                {selling > 0 && cost > 0 && (
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Projected Profit Margin:</span>
                    <span className={margin >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-destructive font-bold'}>
                      ₹{margin.toFixed(2)} ({marginPercent}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Quantity & Low Stock Alert */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Available Stock (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="e.g. 20"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground">Ready-to-sell pieces</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground">Alert when stock drops to this</p>
                </div>
              </div>

              {/* Size & Item Code */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Size / Dimensions
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g. M / L / XL or 38, 40"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Barcode / SKU (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. SHIRT-BLU-M"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-foreground uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description / Brand Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Brand / Product Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Raymond 100% cotton, Navy blue print..."
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[50px]"
                />
              </div>
            </form>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={createReadyMadeMutation.isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {createReadyMadeMutation.isPending ? 'Saving Item...' : 'Save Ready-Made Item'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}

