
import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'ocean'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('shop-theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'ocean'].includes(savedTheme)) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    const themes = {
      light: {
        background: '#F8FAFC',
        card: '#FFFFFF',
        foreground: '#0F172A',
        muted: '#F1F5F9',
        'muted-foreground': '#64748B',
        border: '#E2E8F0',
        primary: '#1E40AF',
        'primary-foreground': '#FFFFFF',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
        info: '#0EA5E9',
      },
      dark: {
        background: '#0F172A',
        card: '#1E293B',
        foreground: '#F1F5F9',
        muted: '#475569',
        'muted-foreground': '#CBD5E1',
        border: '#334155',
        primary: '#60A5FA',
        'primary-foreground': '#0F172A',
        success: '#22C55E',
        danger: '#FF4757',
        warning: '#FFA502',
        info: '#00BCD4',
      },
      ocean: {
        background: '#E0F4FF',
        card: '#FFFFFF',
        foreground: '#0C3D66',
        muted: '#D1E7F0',
        'muted-foreground': '#0E7490',
        border: '#7DD3FC',
        primary: '#0369A1',
        'primary-foreground': '#FFFFFF',
        success: '#059669',
        danger: '#E11D48',
        warning: '#EA580C',
        info: '#0891B2',
      },
    }

    const colors = themes[newTheme]
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('shop-theme', newTheme)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
