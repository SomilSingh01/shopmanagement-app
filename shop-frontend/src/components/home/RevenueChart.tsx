
import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

const fallbackChartData = [
  { day: 'Mon', revenue: 0 },
  { day: 'Tue', revenue: 0 },
  { day: 'Wed', revenue: 0 },
  { day: 'Thu', revenue: 0 },
  { day: 'Fri', revenue: 0 },
  { day: 'Sat', revenue: 0 },
  { day: 'Sun', revenue: 0 },
]

export const RevenueChart: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState('Last 7 Days')

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  const stats = statsData?.data || statsData

  const activeChartData = stats?.chartData || fallbackChartData
  
  const statCards = [
    { label: 'TOTAL REVENUE', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}` },
    { label: 'ACTIVE ORDERS', value: `${stats?.activeOrders || 0}` },
    { label: 'TOTAL CUSTOMERS', value: `${stats?.totalCustomers || 0}` },
  ]

  if (isLoading) {
    return (
      <div className="px-4 py-8 flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-4 space-y-6"
    >
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <span>{timePeriod}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={activeChartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#94A3B8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94A3B8' }}
            />
            <YAxis
              stroke="#94A3B8"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#94A3B8' }}
              domain={['dataMin - 2000', 'dataMax + 2000']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value) => `₹${(value as number).toLocaleString()}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 5 }}
              activeDot={{ r: 7 }}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {card.label}
            </p>
            <h3 className="text-lg font-bold text-foreground">
              {card.value}
            </h3>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
