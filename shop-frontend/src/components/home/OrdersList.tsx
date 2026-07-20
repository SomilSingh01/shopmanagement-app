
import React from 'react'
import type { Order } from '@/types'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface OrdersListProps {
  title: string
  orders: Order[]
  href: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-warning/10 text-warning'
    case 'In Progress':
      return 'bg-info/10 text-info'
    case 'Ready':
      return 'bg-success/10 text-success'
    case 'Delivered':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export const OrdersList: React.FC<OrdersListProps> = ({
  title,
  orders,
  href,
}) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <Link
            to={href}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 border-t border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Link
          to={href}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {orders.slice(0, 3).map((order, index) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-lg p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">
                  {order.customerName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Order #{order.id.slice(0, 8)}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                ₹{order.totalAmount}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
