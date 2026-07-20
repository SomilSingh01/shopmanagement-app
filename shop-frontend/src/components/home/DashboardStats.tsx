
import React from 'react'
import { motion } from 'framer-motion'

interface StatCard {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

interface DashboardStatsProps {
  stats: StatCard[]
}

const colorClasses = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

const bgColorClasses = {
  primary: 'bg-primary/5',
  success: 'bg-success/5',
  warning: 'bg-warning/5',
  danger: 'bg-danger/5',
}

const borderColorClasses = {
  primary: 'border-primary/15',
  success: 'border-success/15',
  warning: 'border-warning/15',
  danger: 'border-danger/15',
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-card border ${borderColorClasses[stat.color || 'primary']} rounded-2xl p-5 flex flex-col`}
          >
            {/* Icon with subtle background */}
            {stat.icon && (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  bgColorClasses[stat.color || 'primary']
                }`}
              >
                <div className={`${colorClasses[stat.color || 'primary']} w-6 h-6`}>
                  {stat.icon}
                </div>
              </div>
            )}

            {/* Title */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {stat.title}
            </p>

            {/* Value */}
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {stat.value}
            </h3>

            {/* Subtitle */}
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stat.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
