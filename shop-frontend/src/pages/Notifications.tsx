import React, { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { ChevronLeft, Trash2, CheckCircle, AlertCircle, Clock, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'alert' | 'pending' | 'info'
  timestamp: string
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-success" />
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-danger" />
    case 'pending':
      return <Clock className="w-5 h-5 text-warning" />
    default:
      return <MessageCircle className="w-5 h-5 text-primary" />
  }
}

const getBgColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-success/10'
    case 'alert':
      return 'bg-danger/10'
    case 'pending':
      return 'bg-warning/10'
    default:
      return 'bg-primary/10'
  }
}

export default function NotificationsPage() {
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    return new Set(JSON.parse(localStorage.getItem('notification_readIds') || '[]'))
  })
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    return new Set(JSON.parse(localStorage.getItem('notification_deletedIds') || '[]'))
  })

  // Save to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('notification_readIds', JSON.stringify(Array.from(readIds)))
  }, [readIds])

  React.useEffect(() => {
    localStorage.setItem('notification_deletedIds', JSON.stringify(Array.from(deletedIds)))
  }, [deletedIds])

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => apiClient.getLowStockAlerts(),
  })

  const { data: recentOrdersData } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => apiClient.getRecentOrders(),
  })

  const dynamicNotifications = useMemo(() => {
    const notifs: Notification[] = []
    
    // Process Low Stock Alerts
    const lowStock = lowStockData?.data || lowStockData || []
    lowStock.forEach((product: any) => {
      notifs.push({
        id: `stock_${product.id}`,
        title: 'Low Stock Alert',
        message: `${product.name} is running low. Only ${product.stock} ${product.unit || 'units'} left.`,
        type: 'alert',
        timestamp: 'Just now'
      })
    })

    // Process Recent Orders
    const recentOrders = recentOrdersData?.data || recentOrdersData || []
    recentOrders.forEach((order: any) => {
      notifs.push({
        id: `order_${order.id}`,
        title: order.status === 'PENDING' ? 'New Pending Order' : 'Order Update',
        message: `Order from ${order.customer?.name || 'Customer'} for ₹${order.total.toLocaleString()}. Status: ${order.status}`,
        type: order.status === 'PENDING' ? 'pending' : 'success',
        timestamp: new Date(order.createdAt).toLocaleDateString()
      })
    })

    // Filter out deleted ones
    return notifs.filter(n => !deletedIds.has(n.id))
  }, [lowStockData, recentOrdersData, deletedIds])

  const handleDeleteNotification = (id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    toast.success('Notification dismissed')
  }

  const handleMarkAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const unreadCount = dynamicNotifications.filter((n) => !readIds.has(n.id)).length

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-4 space-y-3">
        {dynamicNotifications.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {dynamicNotifications.map((notification) => {
              const isRead = readIds.has(notification.id)
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`${
                    isRead ? 'bg-card' : 'bg-primary/5'
                  } border ${
                    isRead ? 'border-border' : 'border-primary/20'
                  } rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`${getBgColor(notification.type)} rounded-lg p-2 flex-shrink-0 mt-1`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-sm ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notification.title}
                          </h3>
                          {!isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNotification(notification.id)
                            }}
                            className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-danger" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 pr-4">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
