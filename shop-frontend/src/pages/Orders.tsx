
import React, { useState } from 'react'
import type { Order } from '@/types'
import { ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreateOrderDrawer } from '@/components/orders/CreateOrderDrawer'

const orderStatuses = ['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-warning/10 text-warning'
    case 'PROCESSING':
      return 'bg-info/10 text-info'
    case 'SHIPPED':
      return 'bg-success/10 text-success'
    case 'DELIVERED':
      return 'bg-muted text-muted-foreground'
    case 'CANCELLED':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const { data: ordersData } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: () => {
      const status = selectedStatus === 'ALL' ? undefined : selectedStatus;
      return apiClient.getOrders(status);
    },
  })
  
  const orders = ordersData?.data || ordersData || []
  
  const filteredOrders = orders

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Orders</h1>

        {/* Status Tabs */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 whitespace-nowrap pb-2">
            {orderStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4 space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => {
            const cName = order.customer?.name || order.customerName || 'Unknown'
            const totalAmt = order.total || order.totalAmount || 0
            
            return (
            <div
              key={order.id}
            >
              <Link to={`/app/orders/${order.id}`}>
                <div className="bg-card border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">
                        {cName}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Order #{order.id.slice(0, 8)} • {order.items?.length || 0} items
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">
                        ₹{totalAmt.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            </div>
          )})
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No orders in this status</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 pb-8 border-t border-border">
          <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors disabled:opacity-50">
            ← Previous
          </button>
          <span className="text-xs text-muted-foreground">Page 1 of 2</span>
          <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors">
            Next →
          </button>
        </div>
      </div>

      {/* FAB - Create Order */}
      <motion.button
        onClick={() => setIsCreateOrderOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <CreateOrderDrawer 
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />
    </div>
  )
}
