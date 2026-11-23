import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { read, write } from '@/lib/storage'
import { getSettingsSync, updateSettings } from '@/services/settings.service'
import type { UserSettings } from '@/types'

interface LanguageContextValue {
  language: UserSettings['language']
  setLanguage: (language: UserSettings['language']) => Promise<void>
  t: (arabic: string, english: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const pageText = {
  ar: { title: 'تواصل — تواصل مع من تحب', description: 'تواصل — منصة اجتماعية عربية تجمعك بأحبائك وأصدقائك' },
  en: { title: 'Tawasol — Connect with your people', description: 'Tawasol — a social platform to connect with friends and family' },
}

function applyLanguage(language: UserSettings['language']) {
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  document.title = pageText[language].title
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) description.content = pageText[language].description
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const version = useDataVersion()
  const [language, setLanguageState] = useState<UserSettings['language']>(() => read('language-preference', 'ar'))

  useEffect(() => {
    const selected = user ? getSettingsSync(user.id).language : read<UserSettings['language']>('language-preference', 'ar')
    setLanguageState(selected)
    if (read('language-preference', 'ar') !== selected) write('language-preference', selected)
    applyLanguage(selected)
  }, [user, version])

  const setLanguage = useCallback(async (next: UserSettings['language']) => {
    if (user) await updateSettings(user.id, { language: next })
    setLanguageState(next)
    write('language-preference', next)
    applyLanguage(next)
  }, [user])

  const t = useCallback((arabic: string, english: string) => language === 'ar' ? arabic : english, [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
