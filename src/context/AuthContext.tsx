import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authService from '@/services/auth.service'
import { updateUser as updateUserService } from '@/services/users.service'
import { getSettingsSync } from '@/services/settings.service'
import { useTheme } from './ThemeContext'
import type { RegisterInput } from '@/services/auth.service'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  updateProfile: (patch: Partial<User>) => Promise<void>
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { syncWithSettings } = useTheme()

  useEffect(() => {
    const current = authService.getCurrentUser()
    setUser(current)
    if (current) syncWithSettings(getSettingsSync(current.id))
    setLoading(false)
  }, [syncWithSettings])

  const login = useCallback(async (email: string, password: string) => {
    const next = await authService.login(email, password)
    setUser(next)
    syncWithSettings(getSettingsSync(next.id))
  }, [syncWithSettings])

  const register = useCallback(async (input: RegisterInput) => {
    const next = await authService.register(input)
    setUser(next)
    syncWithSettings(getSettingsSync(next.id))
  }, [syncWithSettings])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    if (!user) return
    setUser(await updateUserService(user.id, patch))
  }, [user])

  const refresh = useCallback(() => setUser(authService.getCurrentUser()), [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, refresh }),
    [user, loading, login, register, logout, updateProfile, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
