
import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import type { Customer } from '@/types'
import { Search, Plus, Phone, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AddCustomerDrawer } from '@/components/customers/AddCustomerDrawer'

const customerTabs = ['All', 'Recent']

import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function CustomersPage() {
  const [selectedTab, setSelectedTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.getCustomers(),
  })
  
  const customers = customersData?.data || customersData || []

  const filteredCustomers = React.useMemo(() => {
    let filtered = customers.filter(
      (customer: Customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchQuery))
    )

    if (selectedTab === 'Recent') {
      filtered = filtered.slice(0, 5) // Last 5 customers
    }

    return filtered
  }, [searchQuery, selectedTab, customers])

  return (
    <div className="min-h-screen bg-background">
      <Header showActions={false} />

      {/* Page Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Customers</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {customerTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      <div className="px-4 py-4 space-y-3">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-card border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                  {customer.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{customer.name}</h3>

                  <div className="space-y-1 mt-2">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          {customer.phone}
                        </p>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No customers found</p>
          </div>
        )}
      </div>

      {/* FAB - Add Customer */}
      <motion.button
        onClick={() => setIsAddCustomerOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <AddCustomerDrawer
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />
    </div>
  )
}
