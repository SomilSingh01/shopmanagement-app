import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Product, Customer } from '@/types'
import { CustomSelect } from '@/components/ui/CustomSelect'

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
  const [cart, setCart] = useState<CartItem[]>([])

  // Fetch Customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.getCustomers(),
    enabled: isOpen
  })
  const customers = customersData?.data || customersData || []

  // Fetch Products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    enabled: isOpen
  })
  const products = productsData?.data || productsData || []

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // stock decreases
      toast.success('Order created successfully!')
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

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.cartQuantity >= product.stock) {
          toast.error(`Only ${product.stock} in stock!`)
          return prev
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        )
      }
      if (product.stock <= 0) {
        toast.error('Out of stock!')
        return prev
      }
      return [...prev, { ...product, cartQuantity: 1 }]
    })
  }

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.cartQuantity + delta
        if (newQ > item.stock) {
          toast.error(`Only ${item.stock} in stock!`)
          return item
        }
        if (newQ < 1) return item
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
    if (!selectedCustomerId) {
      toast.error('Please select a customer')
      return
    }
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    
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
                <label className="block text-sm font-medium text-foreground mb-1">Select Client *</label>
                <CustomSelect
                  value={selectedCustomerId}
                  onChange={(val) => setSelectedCustomerId(val)}
                  placeholder="-- Choose a Client --"
                  options={customers.map((c: Customer) => ({
                    value: c.id,
                    label: c.name
                  }))}
                />
              </div>

              {/* Product Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground mb-1">Add Products to Cart</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {products.filter((p: Product) => p.stock > 0).map((product: Product) => (
                    <div 
                      key={product.id} 
                      onClick={() => addToCart(product)}
                      className="border border-border p-2 rounded-lg cursor-pointer hover:border-primary transition-colors flex justify-between items-center bg-background"
                    >
                      <div className="truncate pr-2">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">₹{product.price} ({product.stock} in stock)</p>
                      </div>
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    </div>
                  ))}
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
                type="submit"
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending || cart.length === 0 || !selectedCustomerId}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
