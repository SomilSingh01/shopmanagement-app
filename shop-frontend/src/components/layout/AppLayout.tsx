
import React, { useEffect, useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { ProfileDrawer } from '@/components/home/ProfileDrawer'
import { motion, AnimatePresence } from 'framer-motion'

// Define the order of the main tabs for directional sliding
const routeOrder = ['/app', '/app/inventory', '/app/manufacturing', '/app/orders', '/app/customers']

// Main tabs that share the permanent fixed top bar
const mainRoutes = [
  '/app',
  '/app/inventory',
  '/app/manufacturing',
  '/app/orders',
  '/app/customers',
  '/app/settings',
]

const getRouteIndex = (pathname: string) => {
  // exact match first
  const index = routeOrder.indexOf(pathname)
  if (index !== -1) return index
  // fallback for nested routes (e.g. /app/orders/123)
  const baseRoute = routeOrder.find(route => route !== '/app' && pathname.startsWith(route))
  return baseRoute ? routeOrder.indexOf(baseRoute) : 0
}

export default function AppLayout() {
  const location = useLocation()
  const currentOutlet = useOutlet()
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  const [direction, setDirection] = useState(0)

  const showMainHeader = mainRoutes.includes(location.pathname)

  // Calculate direction synchronously during render to ensure Framer Motion
  // gets the correct direction immediately when the component mounts
  if (location.pathname !== prevPathname) {
    const currentIndex = getRouteIndex(location.pathname)
    const prevIndex = getRouteIndex(prevPathname)
    
    let newDirection = 0
    if (currentIndex > prevIndex) {
      newDirection = 1 // slide left (enter from right)
    } else if (currentIndex < prevIndex) {
      newDirection = -1 // slide right (enter from left)
    } else {
      // Same tab nested routing
      newDirection = location.pathname.length > (routeOrder[currentIndex]?.length || 0) ? 1 : -1
    }
    
    setDirection(newDirection)
    setPrevPathname(location.pathname)
  }

  const transition = {
    type: 'tween' as const,
    ease: [0.25, 1, 0.5, 1], // iOS style smooth ease-out (cubic-bezier)
    duration: 0.35,
  }

  const variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      zIndex: 10, // Incoming page ALWAYS slides OVER the old page
    }),
    animate: {
      x: 0,
      zIndex: 10,
      transition,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-20%' : '20%', // Old page gets pushed slightly away in the opposite direction
      zIndex: 0, // Old page stays UNDERNEATH the new incoming page
      transition,
    }),
  }

  return (
    <ProtectedRoute>
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
        {showMainHeader && (
          <Header
            showActions={true}
            onProfileClick={() => setShowProfileDrawer(true)}
          />
        )}

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full absolute inset-0 bg-background will-change-transform z-10 ${
                direction !== 0 ? 'shadow-[-10px_0_30px_rgba(0,0,0,0.05)]' : ''
              }`}
            >
              {/* The inner div handles the scrolling, while the outer motion.div stays static. 
                  This guarantees any 'fixed' elements inside the pages (like FABs) anchor to the static motion.div 
                  and won't scroll with the content! */}
              <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-24">
                {currentOutlet}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* We place BottomNavigation outside the absolute container so it stays fixed */}
        <BottomNavigation />

        {/* Global Profile Drawer accessible from fixed Header across all main tabs */}
        <ProfileDrawer
          isOpen={showProfileDrawer}
          onClose={() => setShowProfileDrawer(false)}
        />
      </div>
    </ProtectedRoute>
  )
}
