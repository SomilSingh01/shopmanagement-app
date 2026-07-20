import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { ChevronLeft, Store, Phone, MapPin, Building2, Tag, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ShopInfoPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    shopName: '',
    shopCategory: '',
    shopAddress: '',
    businessType: 'B2C',
  })

  // Pre-fill with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: (user as any).name || '',
        phone: (user as any).phone || '',
        shopName: (user as any).shopName || '',
        shopCategory: (user as any).shopCategory || '',
        shopAddress: (user as any).shopAddress || '',
        businessType: (user as any).businessType || 'B2C',
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await apiClient.updateProfile(formData)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Shop information updated successfully!')
    } catch (error) {
      toast.error('Failed to update. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Owner Name', icon: <Building2 className="w-5 h-5" />, placeholder: 'Your full name', type: 'text' },
    { key: 'shopName', label: 'Shop Name', icon: <Store className="w-5 h-5" />, placeholder: 'e.g. Mulla Textiles', type: 'text' },
    { key: 'phone', label: 'Phone Number', icon: <Phone className="w-5 h-5" />, placeholder: '+91 98765 43210', type: 'tel' },
    { key: 'shopCategory', label: 'Shop Category', icon: <Tag className="w-5 h-5" />, placeholder: 'e.g. Textiles, Electronics', type: 'text' },
    { key: 'shopAddress', label: 'Shop Address', icon: <MapPin className="w-5 h-5" />, placeholder: 'Full shop address', type: 'text' },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link to="/app/settings">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Shop Information</h1>
            <p className="text-xs text-muted-foreground">Update your shop details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 space-y-4">
        {fields.map((field, index) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              {field.label}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-muted-foreground">
                {field.icon}
              </div>
              <input
                type={field.type}
                value={(formData as any)[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
              />
            </div>
          </motion.div>
        ))}

        {/* Business Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Business Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['B2C', 'B2B'].map((type) => (
              <button
                key={type}
                onClick={() => handleChange('businessType', type)}
                className={`p-4 rounded-xl border text-center font-semibold text-sm transition-all ${
                  formData.businessType === type
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {type === 'B2C' ? '🛍️ B2C (Consumer)' : '🏭 B2B (Business)'}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <div className="px-4 mt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>
    </div>
  )
}
