import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, ShoppingCart, Plus, Minus, Trash2, UserPlus, PackagePlus } from 'lucide-react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Product, Customer } from '@/types'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { AddCustomerDrawer } from '@/components/customers/AddCustomerDrawer'
import { AddReadyMadeDrawer } from '@/components/inventory/AddReadyMadeDrawer'

interface CreateOrderDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface CartItem extends Product {
  cartQuantity: number
}

export const CreateOrderDrawer: React.FC<CreateOrderDrawerProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [clientError, setClientError] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STANDARD' | 'FINISHED_GOOD' | 'RAW_MATERIAL'>('ALL')

  // Fetch Customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.getCustomers(),
    enabled: isOpen
  })
  const customers = customersData?.data || customersData || []

  // Auto-select first client by default so POS checkout is never blocked
  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id)
    }
  }, [customers, selectedCustomerId])

  // Fetch Products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    enabled: isOpen
  })
  const products = productsData?.data || productsData || []

  const readyMadeCount = useMemo(() => products.filter((p: Product) => p.type === 'STANDARD').length, [products])
  const finishedCount = useMemo(() => products.filter((p: Product) => p.type === 'FINISHED_GOOD').length, [products])
  const rawCount = useMemo(() => products.filter((p: Product) => p.type === 'RAW_MATERIAL').length, [products])
  const totalCount = products.length

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => categoryFilter === 'ALL' || p.type === categoryFilter)
  }, [products, categoryFilter])

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] })
      queryClient.invalidateQueries({ queryKey: ['recent-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // stock decreases
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success('Order created successfully! Stock has been deducted.')
      setSelectedCustomerId('')
      setCart([])
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create order')
    }
  })

  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0)
  }, [cart])

  const checkProductStock = (product: Product, currentCartQty: number = 0) => {
    if (product.type === 'FINISHED_GOOD') {
      // If there is existing finished stock that covers this quantity
      if (product.stock > 0 && product.stock >= currentCartQty + 1) {
        return { isOutOfStock: false, reason: '' }
      }
      // Must build from raw materials
      if (!product.bomItems || product.bomItems.length === 0) {
        return { isOutOfStock: true, reason: 'Raw materials not defined' }
      }
      const neededGarments = (currentCartQty + 1) - Math.max(0, product.stock)
      for (const bom of product.bomItems) {
        const required = bom.quantity * neededGarments
        const liveRaw = products.find((p: Product) => p.id === bom.rawMaterialId) || bom.rawMaterial
        const availableRaw = liveRaw?.stock ?? 0
        if (availableRaw < required) {
          const rawName = liveRaw?.name || 'Raw material'
          return { 
            isOutOfStock: true, 
            reason: `${rawName} out of stock` 
          }
        }
      }
      return { isOutOfStock: false, reason: '' }
    } else {
      const isOut = product.stock <= currentCartQty
      return { 
        isOutOfStock: isOut, 
        reason: isOut ? 'Out of Stock (0)' : '' 
      }
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id)
    const currentQty = existing ? existing.cartQuantity : 0
    const stockStatus = checkProductStock(product, currentQty)

    if (stockStatus.isOutOfStock) {
      toast.error(`Cannot order "${product.name}": ${stockStatus.reason}`)
      return
    }

    setCart(prev => {
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        )
      }
      return [...prev, { ...product, cartQuantity: 1 }]
    })
  }

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.cartQuantity + delta
        if (newQ < 1) return item
        if (delta > 0) {
          const stockStatus = checkProductStock(item, item.cartQuantity)
          if (stockStatus.isOutOfStock) {
            toast.error(`Cannot add more "${item.name}": ${stockStatus.reason}`)
            return item
          }
        }
        return { ...item, cartQuantity: newQ }
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error('Your cart is empty. Please add a product first.')
      return
    }
    if (!selectedCustomerId) {
      setClientError(true)
      toast.error('Please select a client to complete the order')
      return
    }
    setClientError(false)
    
    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.cartQuantity,
      price: item.price
    }))

    createOrderMutation.mutate({
      customerId: selectedCustomerId,
      items,
      totalAmount
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-card shadow-2xl border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create Order</h2>
                  <p className="text-sm text-muted-foreground">New Point of Sale Transaction</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Customer Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-foreground">Select Client *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-primary/10 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + New Client
                  </button>
                </div>
                <div className={`transition-all ${clientError ? 'ring-2 ring-destructive rounded-lg' : ''}`}>
                  <CustomSelect
                    value={selectedCustomerId}
                    onChange={(val) => {
                      setSelectedCustomerId(val)
                      if (val) setClientError(false)
                    }}
                    placeholder="-- Choose a Client --"
                    options={customers.map((c: Customer) => ({
                      value: c.id,
                      label: c.name
                    }))}
                  />
                </div>
                {clientError && (
                  <p className="text-xs text-destructive mt-1 font-medium">Please select a client to complete the order</p>
                )}
              </div>

              {/* Product Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Add Products to Cart</label>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-primary/10 transition-colors"
                  >
                    <PackagePlus className="w-3.5 h-3.5" /> + New Product
                  </button>
                </div>

                {/* 3 Categories Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 text-[11px] ${
                      categoryFilter === 'ALL'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('STANDARD')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 text-[11px] ${
                      categoryFilter === 'STANDARD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Ready-Made ({readyMadeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('FINISHED_GOOD')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 text-[11px] ${
                      categoryFilter === 'FINISHED_GOOD'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Items We Make ({finishedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('RAW_MATERIAL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 text-[11px] ${
                      categoryFilter === 'RAW_MATERIAL'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Raw Material ({rawCount})
                  </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      No products found in this category.
                    </div>
                  ) : (
                    filteredProducts.map((product: Product) => {
                      const isMadeToOrder = product.type === 'FINISHED_GOOD'
                      const stockStatus = checkProductStock(product, 0)
                      const isOutOfStock = stockStatus.isOutOfStock

                      return (
                        <div 
                          key={product.id} 
                          onClick={() => {
                            if (isOutOfStock) {
                              toast.error(`Cannot order "${product.name}": ${stockStatus.reason}`)
                              return
                            }
                            addToCart(product)
                          }}
                          className={`border p-2 rounded-xl transition-all flex justify-between items-center bg-background ${
                            isOutOfStock
                              ? 'opacity-40 cursor-not-allowed bg-muted/40 border-border/40 select-none'
                              : 'cursor-pointer shadow-2xs hover:shadow-xs ' + (
                                  product.type === 'STANDARD'
                                    ? 'border-blue-500/20 hover:border-blue-500/50'
                                    : product.type === 'FINISHED_GOOD'
                                    ? 'border-purple-500/20 hover:border-purple-500/50'
                                    : 'border-amber-500/20 hover:border-amber-500/50'
                                )
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                product.type === 'STANDARD'
                                  ? 'bg-blue-500'
                                  : product.type === 'FINISHED_GOOD'
                                  ? 'bg-purple-500'
                                  : 'bg-amber-500'
                              }`} />
                              <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {isOutOfStock ? (
                                <span className="text-destructive font-medium truncate block">
                                  ₹{product.price} • {stockStatus.reason}
                                </span>
                              ) : isMadeToOrder ? (
                                <span>
                                  ₹{product.price} • {product.stock > 0 ? `${product.stock} in stock` : 'Ready to make'}
                                </span>
                              ) : (
                                <span>₹{product.price} ({product.stock} {product.unit || 'pcs'})</span>
                              )}
                            </p>
                          </div>
                          <Plus className={`w-4 h-4 shrink-0 ${isOutOfStock ? 'text-muted-foreground/30' : 'text-primary'}`} />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Cart */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Shopping Cart</label>
                {cart.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                            <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-background rounded">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.cartQuantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-background rounded">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold w-16 text-right">₹{(item.price * item.cartQuantity).toFixed(2)}</p>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-muted-foreground hover:text-danger rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-card space-y-4">
              <div className="flex justify-between items-center text-lg font-bold text-foreground">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
                className={`w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-sm ${
                  createOrderMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Save className="w-5 h-5" />
                {createOrderMutation.isPending ? 'Processing...' : 'Complete Order'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? (
    <>
      {createPortal(modalContent, document.body)}
      <AddCustomerDrawer isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} />
      <AddReadyMadeDrawer isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} />
    </>
  ) : null
}
