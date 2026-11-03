import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Store,
  Palette,
  FileText,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface SettingItem {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  href?: string
  hasToggle?: boolean
}

const settingGroups = [
  {
    title: 'Account',
    items: [
      {
        id: 'shop-info',
        icon: <Store className="w-5 h-5" />,
        title: 'Shop Information',
        description: 'Update shop name, address & business details',
        href: '/app/settings/shop-info',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'appearance',
        icon: <Palette className="w-5 h-5" />,
        title: 'Appearance',
        description: 'Switch between Light, Dark & Ocean themes',
        href: '/app/settings/appearance',
      },
      {
        id: 'push-notify',
        icon: <Bell className="w-5 h-5" />,
        title: 'Push Notifications',
        description: 'Enable order and stock alerts',
        hasToggle: true,
      },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        id: 'invoices',
        icon: <FileText className="w-5 h-5" />,
        title: 'Invoices',
        description: 'View & download invoices for delivered orders',
        href: '/app/settings/invoices',
      },
    ],
  },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    'push-notify': true,
  })

  const handleToggle = (settingId: string) => {
    setToggleStates((prev) => ({
      ...prev,
      [settingId]: !prev[settingId],
    }))
    toast.success(toggleStates[settingId] ? 'Notifications disabled' : 'Notifications enabled')
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Settings Groups */}
      <div className="px-4 py-4 space-y-6">
        {settingGroups.map((group, groupIndex) => (
          <motion.div
            key={groupIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group.title}
            </h2>

            <div className="space-y-2">
              {group.items.map((item, itemIndex) => {
                const buttonContent = (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: (groupIndex * 0.1) + (itemIndex * 0.05) }}
                    className="w-full"
                  >
                    <button
                      onClick={() =>
                        item.hasToggle ? handleToggle(item.id) : null
                      }
                      className="w-full bg-card border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                        {item.icon}
                      </div>

                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      {item.hasToggle ? (
                        <div
                          className={`w-12 h-7 rounded-full flex items-center transition-colors p-0.5 ${
                            toggleStates[item.id]
                              ? 'bg-success'
                              : 'bg-muted'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                              toggleStates[item.id]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  </motion.div>
                )

                return item.href ? (
                  <Link key={item.id} to={item.href}>
                    {buttonContent}
                  </Link>
                ) : (
                  buttonContent
                )
              })}
            </div>
          </motion.div>
        ))}

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account Actions
          </h2>
          <button
            onClick={handleLogout}
            className="w-full bg-danger/5 border border-danger/20 hover:bg-danger/10 text-danger font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-4 py-8 text-center text-xs text-muted-foreground pb-24">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Shield className="w-3 h-3" />
          <span>Shop Manager v1.0.0</span>
        </div>
        <p>All rights reserved © 2026</p>
      </div>
    </div>
  )
}
