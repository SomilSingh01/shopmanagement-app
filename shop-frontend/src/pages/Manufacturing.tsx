import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Product, ManufacturingOrder, BOMItem } from '@/types'
import { Factory, PlayCircle, CheckCircle, Clock, Settings, AlertTriangle, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function ManufacturingPage() {
  const queryClient = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('1')

  // Fetch all products to find Finished Goods & check raw material stock
  const { data: allProductsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  })
  const allProducts = allProductsData?.data || allProductsData || []
  const finishedGoods = allProducts.filter((p: Product) => p.type === 'FINISHED_GOOD')

  // Fetch BOM for selected product to calculate MRP (Material Requirements Planning)
  const { data: bomData, isLoading: bomLoading } = useQuery({
    queryKey: ['bom', selectedProduct],
    queryFn: () => apiClient.getBOM(selectedProduct),
    enabled: !!selectedProduct
  })
  const bomItems = bomData?.data || bomData || []

  // Fetch Manufacturing Orders
  const { data: mfgOrders, isLoading: mfgLoading } = useQuery({
    queryKey: ['manufacturing-orders'],
    queryFn: () => apiClient.getManufacturingOrders(),
  })

  // Calculate MRP and Costs
  const { isFeasible, totalCost, requirements } = useMemo(() => {
    if (!selectedProduct || !bomItems.length) return { isFeasible: true, totalCost: 0, requirements: [] }
    
    let feasible = true
    let cost = 0
    const qty = Number(quantity) || 1

    const reqs = bomItems.map((bom: BOMItem) => {
      const rm = allProducts.find((p: Product) => p.id === bom.rawMaterialId)
      const requiredQty = bom.quantity * qty
      const hasEnough = rm ? rm.stock >= requiredQty : false
      if (!hasEnough) feasible = false
      
      const itemCost = rm ? (rm.price * requiredQty) : 0
      cost += itemCost

      return {
        id: bom.id,
        name: rm?.name || 'Unknown Material',
        required: requiredQty,
        inStock: rm?.stock || 0,
        unit: rm?.unit || 'units',
        hasEnough,
        cost: itemCost
      }
    })

    return { isFeasible: feasible, totalCost: cost, requirements: reqs }
  }, [selectedProduct, quantity, bomItems, allProducts])

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      apiClient.createManufacturingOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      toast.success('Production plan created successfully')
      setSelectedProduct('')
      setQuantity('1')
    },
    onError: () => toast.error('Failed to plan production')
  })

  const completeOrderMutation = useMutation({
    mutationFn: (id: string) => apiClient.completeManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Update inventory stock
      toast.success('Production completed! Inventory updated.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to execute run')
    }
  })

  const handlePlanOrder = () => {
    if (!selectedProduct || !quantity || Number(quantity) <= 0) {
      toast.error('Please select a product and valid quantity')
      return
    }
    if (!isFeasible) {
      toast.error('Insufficient raw materials to plan this run!')
      return
    }
    createOrderMutation.mutate({
      productId: selectedProduct,
      quantity: Number(quantity)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Manufacturing Execution System (MES)
        </h1>
        <p className="text-sm text-muted-foreground">Advanced production planning, MRP calculation, and run execution.</p>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Planning */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Production Planner</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Target Finished Good</label>
                <CustomSelect
                  value={selectedProduct}
                  onChange={(val) => setSelectedProduct(val)}
                  placeholder="Select a product to manufacture..."
                  options={finishedGoods.map((p: Product) => ({
                    value: p.id,
                    label: `${p.name} (SKU: ${p.sku || 'N/A'})`
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Target Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                />
              </div>

              {selectedProduct && bomItems.length === 0 && !bomLoading && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm text-warning font-medium">This product does not have a Bill of Materials (Recipe). Please define it in Inventory first.</p>
                </div>
              )}

              <button
                onClick={handlePlanOrder}
                disabled={createOrderMutation.isPending || !selectedProduct || !isFeasible || bomItems.length === 0}
                className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
              >
                Create Production Plan
              </button>
            </div>
          </div>

          {/* Cost Analysis Card */}
          {selectedProduct && requirements.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-5 rounded-xl shadow-sm">
               <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-success" />
                Cost Estimation
               </h2>
               <div className="flex justify-between items-center text-sm mb-2 text-muted-foreground">
                 <span>Material Cost per Unit</span>
                 <span>₹{(totalCost / (Number(quantity) || 1)).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-base font-bold text-foreground pt-2 border-t border-border">
                 <span>Total Estimated Cost</span>
                 <span>₹{totalCost.toFixed(2)}</span>
               </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: MRP & Active Runs */}
        <div className="lg:col-span-7 space-y-6">
          {/* MRP Table */}
          {selectedProduct && (
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Material Requirements Planning (MRP)</h2>
              {bomLoading ? (
                <p className="text-sm text-muted-foreground">Calculating requirements...</p>
              ) : requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No materials required.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Material</th>
                        <th className="px-4 py-3">Required</th>
                        <th className="px-4 py-3">In Stock</th>
                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((req) => (
                        <tr key={req.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium text-foreground">{req.name}</td>
                          <td className="px-4 py-3">{req.required} {req.unit}</td>
                          <td className="px-4 py-3">{req.inStock} {req.unit}</td>
                          <td className="px-4 py-3">
                            {req.hasEnough ? (
                              <span className="px-2 py-1 text-xs font-bold rounded-full bg-success/20 text-success">Feasible</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-bold rounded-full bg-danger/10 text-danger">Shortfall: {req.required - req.inStock} {req.unit}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Active Production Runs */}
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
              <Factory className="w-5 h-5 text-primary" />
              Active Production Runs
            </h2>
            {mfgLoading ? (
              <p className="text-muted-foreground text-sm">Loading runs...</p>
            ) : mfgOrders?.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground font-medium">No manufacturing orders yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {mfgOrders?.map((order: ManufacturingOrder) => (
                  <div
                    key={order.id}
                    className="bg-background border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {order.quantity}x {order.product?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        Planned on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'COMPLETED' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {order.status}
                      </span>
                      
                      {order.status !== 'COMPLETED' && (
                        <button
                          onClick={() => completeOrderMutation.mutate(order.id)}
                          disabled={completeOrderMutation.isPending}
                          className="bg-foreground text-background px-3 py-1.5 rounded-lg font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Execute Run
                        </button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <div className="text-success flex items-center gap-1 font-semibold text-xs px-2 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Done
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
    </div>
  )
}
