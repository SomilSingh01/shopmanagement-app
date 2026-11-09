import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Layers, Info, CheckCircle2, Scissors, IndianRupee } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface AddItemWeMakeDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface RecipeRow {
  id: string
  name: string
  quantity: string
  unit: string
}

export const AddItemWeMakeDrawer: React.FC<AddItemWeMakeDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient()

  const [garmentName, setGarmentName] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [description, setDescription] = useState('')

  // Freeform recipe rows for 1 piece
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([
    { id: 'row-1', name: '', quantity: '2.5', unit: 'meters' },
    { id: 'row-2', name: '', quantity: '6', unit: 'pcs' }
  ])

  // Fetch existing raw materials to check inventory status
  const { data: allProductsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    enabled: isOpen
  })
  const allProducts: Product[] = allProductsData?.data || allProductsData || []
  const rawMaterials = allProducts.filter((p: Product) => p.type === 'RAW_MATERIAL')

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setGarmentName('')
      setSellingPrice('')
      setDescription('')
      setRecipeRows([
        { id: `row-${Date.now()}-1`, name: '', quantity: '2.5', unit: 'meters' },
        { id: `row-${Date.now()}-2`, name: '', quantity: '6', unit: 'pcs' }
      ])
    }
  }, [isOpen])

  const handleAddRow = () => {
    setRecipeRows(prev => [
      ...prev,
      { id: `row-${Date.now()}`, name: '', quantity: '1', unit: 'pcs' }
    ])
  }

  const handleRemoveRow = (id: string) => {
    if (recipeRows.length === 1) {
      toast.error('Please specify at least one material for the recipe')
      return
    }
    setRecipeRows(prev => prev.filter(r => r.id !== id))
  }

  const handleUpdateRow = (id: string, field: keyof RecipeRow, value: string) => {
    setRecipeRows(prev =>
      prev.map(r => r.id === id ? { ...r, [field]: value } : r)
    )
  }

  // Check if a typed material name exists in raw material inventory
  const findExistingMaterial = (name: string) => {
    if (!name.trim()) return null
    return rawMaterials.find(
      rm => rm.name.trim().toLowerCase() === name.trim().toLowerCase()
    )
  }

  // Submit Mutation
  const saveGarmentMutation = useMutation({
    mutationFn: async () => {
      // 1. Create or resolve all raw materials
      const resolvedBOMItems: Array<{ rawMaterialId: string; quantity: number }> = []

      for (const row of recipeRows) {
        if (!row.name.trim()) continue

        const qty = parseFloat(row.quantity) || 1
        const existingRm = findExistingMaterial(row.name)

        if (!existingRm) {
          // Auto-register pending raw material in inventory with 0 stock so foreign key works & user is reminded to stock it
          const newRm = await apiClient.createProduct({
            name: row.name.trim(),
            type: 'RAW_MATERIAL',
            unit: row.unit,
            stock: 0,
            price: 0,
            lowStockThreshold: 5,
            description: `Auto-created from recipe for ${garmentName.trim()}`
          })
          const newRmId = newRm?.id || newRm?.data?.id
          if (newRmId) {
            resolvedBOMItems.push({ rawMaterialId: newRmId, quantity: qty })
          }
        } else {
          resolvedBOMItems.push({ rawMaterialId: existingRm.id, quantity: qty })
        }
      }

      // 2. Create the Finished Good Garment
      const newGarment = await apiClient.createProduct({
        name: garmentName.trim(),
        type: 'FINISHED_GOOD',
        price: parseFloat(sellingPrice) || 0,
        stock: 0,
        unit: 'pcs',
        description: description.trim() || undefined
      })
      const garmentId = newGarment?.id || newGarment?.data?.id

      // 3. Link all BOM items to this garment
      if (garmentId && resolvedBOMItems.length > 0) {
        await Promise.all(
          resolvedBOMItems.map(item =>
            apiClient.addBOMItem(garmentId, {
              rawMaterialId: item.rawMaterialId,
              quantity: item.quantity
            })
          )
        )
      }

      return newGarment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['bom'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success(`"${garmentName.trim()}" added to items we make!`)
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save item')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = garmentName.trim()
    if (!trimmedName) {
      toast.error('Please enter the garment name (e.g. Kurta, Pant, Shirt)')
      return
    }

    // Duplicate name validation
    const duplicate = allProducts.find(
      p => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )
    if (duplicate) {
      toast.error(`An item named "${trimmedName}" already exists. Please choose a different name.`)
      return
    }

    const validRows = recipeRows.filter(r => r.name.trim().length > 0)
    if (validRows.length === 0) {
      toast.error('Please add at least one material needed to make this garment')
      return
    }
    saveGarmentMutation.mutate()
  }

  const unstockedCount = recipeRows.filter(r => r.name.trim() && !findExistingMaterial(r.name)).length

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
            className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-card shadow-2xl border-l border-border z-[60] flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Add Item We Make
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define what you build (Kurta, Pant, Shirt) & its recipe
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
              {/* Garment Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What Are We Building? (Garment Name) *
                </label>
                <input
                  type="text"
                  required
                  value={garmentName}
                  onChange={(e) => setGarmentName(e.target.value)}
                  placeholder="e.g. Cotton Kurta, Formal Pant, Silk Suit, Denim Shirt"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Standard Selling Price Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Standard Selling Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-muted-foreground font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Default retail price (can still be adjusted per customer during manufacturing)
                </p>
              </div>

              {/* Required Materials Card / Rows */}
              <div className="border border-border rounded-2xl p-4 bg-muted/20 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Materials Required (per 1 piece) *
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Cloth, buttons, or accessories used to sew 1 unit
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {recipeRows.length} ingredient{recipeRows.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Material Cards */}
                <div className="space-y-2.5">
                  {recipeRows.map((row, index) => {
                    const existing = findExistingMaterial(row.name)

                    return (
                      <div
                        key={row.id}
                        className="bg-card border border-border rounded-xl p-3 space-y-2.5 shadow-sm transition-all hover:border-purple-500/40"
                      >
                        {/* Top Line: Material Name + Delete Icon */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              required
                              placeholder="Material name (e.g. Cotton Cloth, Buttons, Zip)"
                              value={row.name}
                              onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold text-foreground focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder:text-muted-foreground/60"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                            title="Remove material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bottom Line: Quantity & Unit */}
                        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/50">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                              Qty for 1 pc:
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={row.quantity}
                              onChange={(e) => handleUpdateRow(row.id, 'quantity', e.target.value)}
                              className="w-20 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground text-center focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-medium text-muted-foreground">Unit:</span>
                            <select
                              value={row.unit}
                              onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                              className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            >
                              <option value="meters">meters (m)</option>
                              <option value="pcs">pieces (pcs)</option>
                              <option value="cm">cm</option>
                              <option value="spools">spools</option>
                              <option value="kg">kg</option>
                              <option value="g">grams</option>
                            </select>
                          </div>
                        </div>

                        {/* Status / Inventory Reminder Tag */}
                        {row.name.trim().length > 0 && (
                          <div className="pt-0.5">
                            {existing ? (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>In Inventory: <strong>{existing.stock} {existing.unit}</strong> available (₹{existing.price}/{existing.unit})</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span>Not yet stocked in inventory (will be added as pending)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add Material Button */}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full py-2.5 bg-card hover:bg-muted border border-dashed border-purple-500/40 hover:border-purple-500 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Material</span>
                </button>
              </div>

              {/* Informative Stock Note */}
              {unstockedCount > 0 && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Note:</strong> {unstockedCount} item{unstockedCount > 1 ? 's' : ''} in this recipe are not yet stocked in inventory. When saved, they will automatically be recorded under <strong>Raw Materials</strong> with 0 stock so you can update their purchase stock anytime.
                  </p>
                </div>
              )}

              {/* Design Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stitching & Pattern Instructions (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Mandarin collar, regular fit, double cuff stitching..."
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all min-h-[60px]"
                />
              </div>
            </form>

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={saveGarmentMutation.isPending}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveGarmentMutation.isPending ? 'Saving Design & Recipe...' : 'Save Item We Make'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
