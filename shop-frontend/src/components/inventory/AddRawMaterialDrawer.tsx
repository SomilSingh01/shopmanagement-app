import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Scissors, AlertTriangle, Layers, Tag } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import { CustomSelect } from '@/components/ui/CustomSelect'

import type { Product } from '@/types'

interface AddRawMaterialDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialName?: string
  initialUnit?: string
  product?: Product | null
}

export const AddRawMaterialDrawer: React.FC<AddRawMaterialDrawerProps> = ({
  isOpen,
  onClose,
  initialName = '',
  initialUnit = 'meters',
  product
}) => {
  const queryClient = useQueryClient()
  const isEditing = !!product

  const { data: allProductsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    enabled: isOpen
  })
  const allProducts: Product[] = allProductsData?.data || allProductsData || []

  const [formData, setFormData] = useState({
    name: initialName,
    unit: initialUnit,
    stock: '',
    price: '',
    lowStockThreshold: '10',
    sku: '',
    description: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name,
          unit: product.unit || 'meters',
          stock: product.stock !== undefined ? product.stock.toString() : '',
          price: product.price !== undefined ? product.price.toString() : '',
          lowStockThreshold: product.lowStockThreshold !== undefined ? product.lowStockThreshold.toString() : '10',
          sku: product.sku || '',
          description: product.description || ''
        })
      } else {
        setFormData({
          name: initialName,
          unit: initialUnit,
          stock: '',
          price: '',
          lowStockThreshold: '10',
          sku: '',
          description: ''
        })
      }
    }
  }, [isOpen, initialName, initialUnit, product])

  const materialMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing && product) {
        return apiClient.updateProduct(product.id, data)
      }
      return apiClient.createProduct(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success(isEditing ? `Updated "${formData.name.trim()}"!` : `Added raw material "${formData.name.trim()}"!`)
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isEditing ? 'Failed to update raw material' : 'Failed to add raw material'))
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      toast.error('Please enter the material name')
      return
    }

    // Duplicate name validation
    const duplicate = allProducts.find(
      p => p.name.trim().toLowerCase() === trimmedName.toLowerCase() && (!isEditing || p.id !== product?.id)
    )
    if (duplicate) {
      toast.error(`A material named "${trimmedName}" already exists. Please choose a different name.`)
      return
    }

    if (!formData.price) {
      toast.error(`Please enter the purchase cost per ${formData.unit}`)
      return
    }

    materialMutation.mutate({
      name: trimmedName,
      type: 'RAW_MATERIAL',
      unit: formData.unit,
      stock: formData.stock ? Number(formData.stock) : 0,
      price: Number(formData.price),
      lowStockThreshold: formData.lowStockThreshold ? Number(formData.lowStockThreshold) : 10,
      sku: formData.sku?.trim() || undefined,
      description: formData.description?.trim() || undefined
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
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {isEditing ? 'Edit Raw Material' : 'Add Raw Material'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEditing ? 'Update stock quantity, cost per unit, or alert threshold' : 'Record fabric, buttons, zippers, or thread into workshop stock'}
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
              {/* Material Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Material / Fabric Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pure Cotton Fabric, Metallic Buttons, Brass Zip"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Unit of Measurement */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Unit of Measurement *
                </label>
                <CustomSelect
                  value={formData.unit}
                  onChange={(val) => setFormData({ ...formData, unit: val })}
                  options={[
                    { value: 'meters', label: 'Meters (m) — for Fabric / Cloth' },
                    { value: 'pcs', label: 'Pieces (pcs) — for Buttons, Zips, Hooks' },
                    { value: 'spools', label: 'Spools / Reels — for Thread' },
                    { value: 'cm', label: 'Centimeters (cm)' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                    { value: 'g', label: 'Grams (g)' },
                    { value: 'box', label: 'Boxes' }
                  ]}
                />
              </div>

              {/* Inventory Stock & Purchase Cost Card */}
              <div className="border border-border rounded-2xl p-4 bg-muted/20 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Stock & Purchase Cost
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Initial inventory balance and purchase rate
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Available Stock ({formData.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="e.g. 100"
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground">Current in-hand stock</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Cost per {formData.unit} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Purchase cost per unit</p>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Low Stock Warning Threshold ({formData.unit})
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  Triggers an inventory warning badge whenever stock drops to or below this amount.
                </p>
              </div>

              {/* Optional SKU & Notes */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. RM-COT-01"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-foreground uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Color / Mill / Notes
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Navy Blue, 60s"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </form>

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={materialMutation.isPending}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {materialMutation.isPending ? 'Saving...' : isEditing ? 'Update Raw Material' : 'Save Raw Material'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
