export type Language = 'ar' | 'en'

export function currentLanguage(): Language {
  try {
    const raw = localStorage.getItem('tawasol:language-preference')
    return raw && JSON.parse(raw) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

export function pick(arabic: string, english: string): string {
  return currentLanguage() === 'ar' ? arabic : english
}
