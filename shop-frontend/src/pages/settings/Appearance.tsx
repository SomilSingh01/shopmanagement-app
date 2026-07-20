import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { ChevronLeft, Check, Sun, Moon, Waves } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const themes = [
  {
    id: 'light' as const,
    name: 'Light',
    icon: <Sun className="w-6 h-6" />,
    description: 'Clean and bright for daytime use',
    preview: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      primary: '#1E40AF',
      text: '#0F172A',
      muted: '#F1F5F9',
    },
  },
  {
    id: 'dark' as const,
    name: 'Dark',
    icon: <Moon className="w-6 h-6" />,
    description: 'Easy on the eyes in low light',
    preview: {
      bg: '#0F172A',
      card: '#1E293B',
      primary: '#60A5FA',
      text: '#F1F5F9',
      muted: '#475569',
    },
  },
  {
    id: 'ocean' as const,
    name: 'Ocean',
    icon: <Waves className="w-6 h-6" />,
    description: 'Calm blue tones for focus',
    preview: {
      bg: '#E0F4FF',
      card: '#FFFFFF',
      primary: '#0369A1',
      text: '#0C3D66',
      muted: '#D1E7F0',
    },
  },
]

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (themeId: 'light' | 'dark' | 'ocean') => {
    setTheme(themeId)
    toast.success(`Switched to ${themeId.charAt(0).toUpperCase() + themeId.slice(1)} theme`)
  }

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
            <h1 className="text-xl font-bold text-foreground">Appearance</h1>
            <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
          </div>
        </div>
      </div>

      {/* Theme Cards */}
      <div className="px-4 py-6 space-y-4">
        {themes.map((t, index) => {
          const isActive = theme === t.id
          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeChange(t.id)}
              className={`w-full rounded-2xl border-2 overflow-hidden transition-all ${
                isActive
                  ? 'border-primary shadow-lg shadow-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {/* Theme Preview */}
              <div
                className="p-4 flex items-center gap-3"
                style={{ backgroundColor: t.preview.bg }}
              >
                {/* Mini mockup */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: t.preview.card, border: `1px solid ${t.preview.muted}` }}
                >
                  <div style={{ color: t.preview.primary }}>{t.icon}</div>
                </div>
                <div className="flex-1 text-left space-y-1.5">
                  <div
                    className="h-2.5 rounded-full w-3/4"
                    style={{ backgroundColor: t.preview.text, opacity: 0.8 }}
                  />
                  <div
                    className="h-2 rounded-full w-1/2"
                    style={{ backgroundColor: t.preview.muted }}
                  />
                  <div
                    className="h-2 rounded-full w-2/3"
                    style={{ backgroundColor: t.preview.primary, opacity: 0.5 }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-card p-4 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                {isActive && (
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
