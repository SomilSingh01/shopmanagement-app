import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Factory, ShoppingCart, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { AddProductDrawer } from '@/components/inventory/AddProductDrawer'
import { AddCustomerDrawer } from '@/components/customers/AddCustomerDrawer'
import { CreateOrderDrawer } from '@/components/orders/CreateOrderDrawer'

export const QuickActions = () => {
  const [isAddProductOpen, setIsAddProductOpen] = React.useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = React.useState(false)

  const actions = [
    {
      label: 'Add Product',
      icon: <Plus className="w-6 h-6 text-blue-600" />,
      onClick: () => setIsAddProductOpen(true),
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Manufacture',
      icon: <Factory className="w-6 h-6 text-purple-600" />,
      href: '/app/manufacturing',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'New Order',
      icon: <ShoppingCart className="w-6 h-6 text-green-600" />,
      onClick: () => setIsCreateOrderOpen(true),
      bgColor: 'bg-green-100',
    },
    {
      label: 'Add Client',
      icon: <Users className="w-6 h-6 text-orange-600" />,
      onClick: () => setIsAddCustomerOpen(true),
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="px-4 pt-6 pb-2">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const content = (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-start gap-2 h-full cursor-pointer mt-2"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${action.bgColor}`}>
                {action.icon}
              </div>
              <span className="text-[11px] font-semibold text-foreground text-center line-clamp-1 w-full truncate mt-1">
                {action.label}
              </span>
            </motion.div>
          )

          if (action.href) {
            return <Link key={action.label} to={action.href}>{content}</Link>
          }

          return (
            <div key={action.label} onClick={action.onClick}>
              {content}
            </div>
          )
        })}
      </div>

      <AddProductDrawer 
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
      />

      <AddCustomerDrawer
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      <CreateOrderDrawer
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />
    </div>
  )
}
