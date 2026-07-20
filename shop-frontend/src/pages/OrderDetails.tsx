import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Briefcase
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-warning/10 text-warning border-warning/20'
    case 'PROCESSING':
      return 'bg-info/10 text-info border-info/20'
    case 'SHIPPED':
      return 'bg-success/10 text-success border-success/20'
    case 'DELIVERED':
      return 'bg-muted text-muted-foreground border-border'
    case 'CANCELLED':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="w-4 h-4" />
    case 'PROCESSING':
      return <AlertCircle className="w-4 h-4" />
    case 'SHIPPED':
    case 'DELIVERED':
      return <CheckCircle2 className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.getOrder(id as string),
    enabled: !!id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => apiClient.updateOrderStatus(id as string, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] })
      toast.success('Order status updated successfully')
    },
    onError: () => {
      toast.error('Failed to update order status')
    },
    onSettled: () => {
      setIsUpdating(false)
    }
  })

  const order = orderData?.data || orderData

  const handleStatusUpdate = (status: string) => {
    setIsUpdating(true)
    updateStatusMutation.mutate(status)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header showActions={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header showActions={false} />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">Order not found</p>
          <button 
            onClick={() => navigate('/app/orders')}
            className="text-primary font-medium hover:underline"
          >
            Go back to Orders
          </button>
        </div>
      </div>
    )
  }

  const customer = order.customer
  const cName = customer?.name || order.customerName || 'Unknown Customer'
  const cPhone = customer?.phone || 'No phone provided'
  const cEmail = customer?.email || 'No email provided'
  const cType = customer?.type || 'B2C'
  const cAddress = customer?.address || 'No address provided'
  const totalAmt = order.total || order.totalAmount || 0
  const items = order.items || []

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Custom Header for Details Page */}
      <div className="bg-card border-b border-border sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate('/app/orders')}
          className="p-2 hover:bg-muted rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Order Details</h1>
          <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Status Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl border flex items-center justify-between ${getStatusColor(order.status)}`}
        >
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <span className="font-bold text-sm tracking-wide uppercase">{order.status}</span>
          </div>
          <span className="text-xs font-medium opacity-80">
            {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </motion.div>

        {/* Customer Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customer Information</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{cName}</h3>
              <div className="flex items-center gap-1 mt-1 text-primary">
                <Briefcase className="w-3 h-3" />
                <span className="text-xs font-semibold">{cType}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
              {cName.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="space-y-3 mt-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-foreground">{cPhone}</p>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-foreground">{cEmail}</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{cAddress}</p>
            </div>
          </div>
        </motion.div>

        {/* Order Items Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order Items</h2>
            <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full">{items.length} items</span>
          </div>
          
          <div className="divide-y divide-border">
            {items.map((item: any) => {
              const pName = item.product?.name || 'Unknown Product'
              const sku = item.product?.sku || ''
              return (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground line-clamp-1">{pName}</p>
                      {sku && <p className="text-xs text-muted-foreground font-mono mt-0.5">{sku}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">₹{item.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Payment Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">₹{totalAmt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (0%)</span>
              <span className="text-foreground font-medium">₹0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-success font-medium">-₹0</span>
            </div>
            <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
              <span className="text-base font-bold text-foreground">Total Amount</span>
              <span className="text-xl font-bold text-primary">₹{totalAmt.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Action Bar (Scrolls with page) */}
      <div className="p-4 mt-4">
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          {order.status === 'PENDING' && (
            <button 
              disabled={isUpdating}
              onClick={() => handleStatusUpdate('PROCESSING')}
              className="flex-1 bg-info hover:bg-info/90 text-info-foreground font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-info/20 transition-all disabled:opacity-50"
            >
              Start Production
            </button>
          )}
          {order.status === 'PROCESSING' && (
            <button 
              disabled={isUpdating}
              onClick={() => handleStatusUpdate('SHIPPED')}
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-success/20 transition-all disabled:opacity-50"
            >
              Mark as Shipped
            </button>
          )}
          {order.status === 'SHIPPED' && (
            <button 
              disabled={isUpdating}
              onClick={() => handleStatusUpdate('DELIVERED')}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              Mark as Delivered
            </button>
          )}
          {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
            <button 
              disabled
              className="flex-1 bg-muted text-muted-foreground font-semibold py-3.5 px-4 rounded-xl cursor-not-allowed"
            >
              Order Completed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
