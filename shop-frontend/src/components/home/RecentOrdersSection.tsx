
import React from 'react'
import { motion } from 'framer-motion'
import type { Order } from '@/types'
import { Link } from 'react-router-dom'

interface RecentOrdersSectionProps {
  orders: Order[]
}

export const RecentOrdersSection: React.FC<RecentOrdersSectionProps> = ({
  orders,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600'
      case 'ready':
        return 'text-blue-600'
      case 'in progress':
        return 'text-orange-600'
      case 'pending':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-blue-100',
      'bg-orange-100',
      'bg-pink-100',
      'bg-green-100',
      'bg-yellow-100',
    ]
    return colors[name.length % colors.length]
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'text-blue-600',
      'text-orange-600',
      'text-pink-600',
      'text-green-600',
      'text-yellow-600',
    ]
    return colors[name.length % colors.length]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 pb-24"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
        <Link to="/app/orders">
          <span className="text-xs text-primary hover:underline cursor-pointer">
            View all
          </span>
        </Link>
      </div>

      <div className="space-y-3">
        {orders.map((order, index) => {
          const cName = order.customer?.name || order.customerName || 'Unknown'
          const totalAmt = order.total || order.totalAmount || 0
          
          return (
          <Link
            key={order.id}
            to={`/app/orders/${order.id}`}
            className="block hover:opacity-95 transition-opacity"
          >
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors">
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarBg(
                  cName
                )}`}
              >
                <span className={`text-sm font-bold ${getAvatarColor(cName)}`}>
                  {cName[0]?.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {cName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.items?.length || 0} item
                  {order.items?.length !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-foreground">₹{totalAmt.toLocaleString()}</p>
                <p className={`text-xs font-medium mt-1 ${getStatusColor(order.status)}`}>
                  {order.status}
                </p>
              </div>
            </div>
          </Link>
        )})}
      </div>
    </motion.div>
  )
}
