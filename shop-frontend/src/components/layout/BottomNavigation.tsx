
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Factory
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/app', icon: <Home className="w-5 h-5" /> },
  { name: 'Inventory', href: '/app/inventory', icon: <Package className="w-5 h-5" /> },
  { name: 'Manufacture', href: '/app/manufacturing', icon: <Factory className="w-5 h-5" /> },
  { name: 'Orders', href: '/app/orders', icon: <ShoppingCart className="w-5 h-5" /> },
  { name: 'Customers', href: '/app/customers', icon: <Users className="w-5 h-5" /> },
]

export const BottomNavigation = () => {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors duration-200 ${
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
