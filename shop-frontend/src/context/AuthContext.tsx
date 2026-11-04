
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, AuthContextType } from '@/types'
import { apiClient } from '@/lib/api'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /* Initialize auth on mount */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to fetch user. If there is a valid HttpOnly cookie, this will succeed.
        const userData = await apiClient.getMe()
        setUser(userData)
      } catch (error) {
        // Only log non-401 errors, since 401 just means the user isn't logged in yet
        if (axios.isAxiosError(error) && error.response?.status !== 401) {
          console.error('Auth initialization failed:', error)
        }
        // No action needed, user remains null
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      const { user: userData } = await apiClient.login(email, password)
      setUser(userData)
    } catch (error: unknown) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await apiClient.logout()
      setUser(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
