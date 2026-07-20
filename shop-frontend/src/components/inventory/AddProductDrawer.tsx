import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface AddProductDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const AddProductDrawer: React.FC<AddProductDrawerProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    type: 'STANDARD',
    unit: 'pcs',
    sku: '',
    dimensions: ''
  })

  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Item added successfully!')
      setFormData({ name: '', description: '', price: '', stock: '', type: 'STANDARD', unit: 'pcs', sku: '', dimensions: '' })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }
    
    createProductMutation.mutate({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      price: Number(formData.price),
      stock: formData.stock ? Number(formData.stock) : 0,
      unit: formData.unit,
      sku: formData.sku,
      dimensions: formData.dimensions
    })
  }

  // Render modal content safely
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-card shadow-2xl border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Add New Product</h2>
                <p className="text-sm text-muted-foreground">Create a new item in your inventory</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cotton T-Shirt"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product Type *</label>
                <CustomSelect
                  value={formData.type}
                  onChange={(val) => setFormData({ ...formData, type: val })}
                  options={[
                    { value: 'STANDARD', label: 'Standard Item' },
                    { value: 'RAW_MATERIAL', label: 'Raw Material (For Manufacturing)' },
                    { value: 'FINISHED_GOOD', label: 'Finished Good (Manufactured)' }
                  ]}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Finished Goods can be manufactured using Raw Materials.
                </p>
              </div>

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
                    { value: 'liters', label: 'Liters (L)' },
                    { value: 'ml', label: 'Milliliters (ml)' },
                    { value: 'sqft', label: 'Square Feet (sq. ft)' },
                    { value: 'box', label: 'Boxes' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder={`e.g. 100`}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. RM-COT-01"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g. 10x10x5 cm"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </form>

            <div className="p-4 border-t border-border bg-card">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={createProductMutation.isPending}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {createProductMutation.isPending ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
