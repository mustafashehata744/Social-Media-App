import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { read, write } from '@/lib/storage'
import { getSettingsSync, resolveTheme } from '@/services/settings.service'
import type { ThemeMode, UserSettings } from '@/types'

interface ThemeContextValue {
  theme: ThemeMode
  isDark: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  syncWithSettings: (settings: UserSettings) => void
}

function saveTheme(theme: ThemeMode) {
  try { write('theme', theme) } catch { /* ignore */ }
}

function applyResolved(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => read<ThemeMode>('theme', 'system'))
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    const sync = () => {
      const session = read<{ userId: string } | null>('session', null)
      if (session) setSettings(getSettingsSync(session.userId))
    }
    sync()
    window.addEventListener('tawasol:changed', sync)
    return () => window.removeEventListener('tawasol:changed', sync)
  }, [])

  useEffect(() => {
    const active = settings ? resolveTheme({ ...settings, theme }) : theme
    const resolved: 'light' | 'dark' =
      active === 'dark' ? 'dark'
      : active === 'light' ? 'light'
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    applyResolved(resolved)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const nextActive = settings ? resolveTheme({ ...settings, theme }) : theme
      if (nextActive === 'system') {
        applyResolved(media.matches ? 'dark' : 'light')
      }
    }
    media.addEventListener('change', onChange)

    // Re-evaluate dark schedule every minute.
    const interval = settings?.themeSchedule ? window.setInterval(() => {
      const nextActive = resolveTheme({ ...settings, theme })
      const nextResolved = nextActive === 'dark' ? 'dark'
        : nextActive === 'light' ? 'light'
        : media.matches ? 'dark' : 'light'
      applyResolved(nextResolved)
    }, 60_000) : undefined

    return () => {
      media.removeEventListener('change', onChange)
      if (interval) window.clearInterval(interval)
    }
  }, [theme, settings])

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), [])
  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])
  const syncWithSettings = useCallback((next: UserSettings) => setSettings(next), [])

  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    setIsDark(document.documentElement.classList.contains('dark'))
    return () => observer.disconnect()
  }, [])

  const value = useMemo(() => ({ theme, isDark, setTheme, toggleTheme, syncWithSettings }), [theme, isDark, setTheme, toggleTheme, syncWithSettings])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
