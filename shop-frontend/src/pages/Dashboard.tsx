
import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { QuickActions } from '@/components/home/QuickActions'
import { RevenueChart } from '@/components/home/RevenueChart'
import { RecentOrdersSection } from '@/components/home/RecentOrdersSection'
import { ProfileDrawer } from '@/components/home/ProfileDrawer'
import type { Order } from '@/types'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export default function HomePage() {
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const { data: ordersData } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: () => apiClient.getOrders(),
  })
  
  const orders = ordersData?.data || ordersData || []

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        showActions={true}
        onProfileClick={() => setShowProfileDrawer(true)}
      />

      {/* Quick Actions Panel */}
      <QuickActions />

      {/* Revenue Chart Section */}
      <RevenueChart />

      {/* Recent Orders Section */}
      <RecentOrdersSection orders={orders} />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
      />
    </div>
  )
}
