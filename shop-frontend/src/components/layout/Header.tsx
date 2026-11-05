
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, RefreshCw, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'

interface HeaderProps {
  showActions?: boolean
  onProfileClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  showActions = true,
  onProfileClick,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const queryClient = useQueryClient()

  const handleLogout = async () => {
    try {
      setShowMenu(false)
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setIsRefreshing(false), 300)
  }

  // Calculate unread notifications quickly
  const { data: lowStockData } = useQuery({ queryKey: ['low-stock'], queryFn: () => apiClient.getLowStockAlerts() })
  const { data: recentOrdersData } = useQuery({ queryKey: ['recent-orders'], queryFn: () => apiClient.getRecentOrders() })
  
  const hasUnreadNotifications = () => {
    const deletedIds = JSON.parse(localStorage.getItem('notification_deletedIds') || '[]')
    const readIds = JSON.parse(localStorage.getItem('notification_readIds') || '[]')
    
    let totalUnread = 0
    const lowStock = lowStockData?.data || lowStockData || []
    lowStock.forEach((product: any) => {
      const id = `stock_${product.id}`
      if (!deletedIds.includes(id) && !readIds.includes(id)) totalUnread++
    })
    
    const recentOrders = recentOrdersData?.data || recentOrdersData || []
    recentOrders.forEach((order: any) => {
      const id = `order_${order.id}`
      if (!deletedIds.includes(id) && !readIds.includes(id)) totalUnread++
    })
    
    return totalUnread > 0
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Left: Avatar & Name */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border/80 shadow-xs flex items-center justify-center bg-card shrink-0">
            <img
              src="/shop-favicon.png"
              alt="Shop Favicon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">Shop Manager</p>
          </div>
        </button>

        {/* Right: Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-muted rounded-lg transition-colors relative"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.6 }}
              >
                <RefreshCw className="w-5 h-5 text-foreground" />
              </motion.div>
            </button>

            <Link to="/app/notifications">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-foreground" />
                {hasUnreadNotifications() && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
                )}
              </button>
            </Link>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <div className="h-0.5 bg-foreground"></div>
                  <div className="h-0.5 bg-foreground"></div>
                  <div className="h-0.5 bg-foreground"></div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted text-foreground text-sm transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
