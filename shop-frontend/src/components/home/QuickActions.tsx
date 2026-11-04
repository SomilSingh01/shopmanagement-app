import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Factory, ShoppingCart, Users, Scissors } from 'lucide-react'
import { motion } from 'framer-motion'
import { AddItemWeMakeDrawer } from '@/components/inventory/AddItemWeMakeDrawer'
import { AddRawMaterialDrawer } from '@/components/inventory/AddRawMaterialDrawer'
import { AddCustomerDrawer } from '@/components/customers/AddCustomerDrawer'
import { CreateOrderDrawer } from '@/components/orders/CreateOrderDrawer'

export const QuickActions = () => {
  const [isAddItemWeMakeOpen, setIsAddItemWeMakeOpen] = useState(false)
  const [isAddRawMaterialOpen, setIsAddRawMaterialOpen] = useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)

  const actions = [
    {
      label: '+ Item We Make',
      icon: <Scissors className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      onClick: () => setIsAddItemWeMakeOpen(true),
    },
    {
      label: 'Manufacture',
      icon: <Factory className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      href: '/app/manufacturing',
    },
    {
      label: '+ Raw Material',
      icon: <Plus className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      onClick: () => setIsAddRawMaterialOpen(true),
    },
    {
      label: 'New Order',
      icon: <ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      onClick: () => setIsCreateOrderOpen(true),
    },
    {
      label: 'Add Client',
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      onClick: () => setIsAddCustomerOpen(true),
    },
  ]

  return (
    <div className="px-4 pt-5 pb-2">
      <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h2>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action) => {
          const content = (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-start gap-1.5 h-full cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-transparent border border-border/70 hover:border-border transition-colors">
                {action.icon}
              </div>
              <span className="text-[10px] font-semibold text-foreground text-center line-clamp-1 w-full truncate text-ellipsis">
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

      {/* Drawer for Defining Garments We Make (Kurta, Pant, Shirt) */}
      <AddItemWeMakeDrawer 
        isOpen={isAddItemWeMakeOpen}
        onClose={() => setIsAddItemWeMakeOpen(false)}
      />

      {/* Drawer for Adding Raw Materials (Cloth, Buttons, etc.) */}
      <AddRawMaterialDrawer 
        isOpen={isAddRawMaterialOpen}
        onClose={() => setIsAddRawMaterialOpen(false)}
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
