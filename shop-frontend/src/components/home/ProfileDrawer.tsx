import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/context/AuthContext'
import { X, Mail, Phone, Store, Settings, Edit, Activity, Users, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { EditProfileModal } from './EditProfileModal'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch dynamic activity stats
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
    enabled: isOpen,
  })

  const stats = statsData?.data || statsData

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
          >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="px-4 pb-8">
          {/* Header */}
          <div className="text-center mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -mx-4 px-4 pt-6 pb-8 border-b border-border">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-info flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-lg shadow-primary/20">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-sm text-primary font-medium mt-1">
              {user?.shopName || 'Shop Owner'}
            </p>
          </div>

          {/* Personal Info Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase">
              Personal Information
            </h3>
            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.phone || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Info Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase">
              Shop Information
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Store className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Shop Name</p>
                <p className="text-sm font-medium text-foreground">
                  {user?.shopName || 'My Shop'}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Activity Overview
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
                <ShoppingBag className="w-5 h-5 text-primary mx-auto mb-2 opacity-80" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalOrders || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Orders</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
                <Users className="w-5 h-5 text-success mx-auto mb-2 opacity-80" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalCustomers || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Customers</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
                <Activity className="w-5 h-5 text-info mx-auto mb-2 opacity-80" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalProducts || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Products</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/app/settings';
              }}
              className="w-full bg-secondary border border-border hover:bg-secondary/80 text-secondary-foreground font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              App Settings
            </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}
