import { delay, read, write } from '@/lib/storage'
import { defaultSettings } from '@/data/seed'
import { KEYS, ensureDB } from './db'
import { isScheduleActive } from '@/lib/utils'
import type { ThemeMode, UserSettings } from '@/types'

function normalize(userId: string, stored?: UserSettings): UserSettings {
  return {
    ...defaultSettings(userId),
    ...stored,
    userId,
    background: stored?.background ?? 'default',
  }
}

export async function getSettings(userId: string): Promise<UserSettings> {
  ensureDB()
  await delay(80)
  const stored = read<Record<string, UserSettings>>(KEYS.settings, {})[userId]
  return normalize(userId, stored)
}

export function getSettingsSync(userId: string): UserSettings {
  ensureDB()
  const stored = read<Record<string, UserSettings>>(KEYS.settings, {})[userId]
  return normalize(userId, stored)
}

export async function updateSettings(userId: string, patch: Partial<UserSettings>): Promise<UserSettings> {
  ensureDB()
  await delay(250)
  const all = read<Record<string, UserSettings>>(KEYS.settings, {})
  const updated: UserSettings = { ...(all[userId] ?? defaultSettings(userId)), ...patch, userId }
  all[userId] = updated
  write(KEYS.settings, all)
  return updated
}

export function resolveTheme(settings: UserSettings): ThemeMode {
  if (settings.themeSchedule && settings.scheduleStart && settings.scheduleEnd &&
      isScheduleActive(settings.scheduleStart, settings.scheduleEnd)) {
    return 'dark'
  }
  return settings.theme
}

export function applyTheme(theme: ThemeMode): void {
  const dark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function applySettingsTheme(settings: UserSettings): void {
  applyTheme(resolveTheme(settings))
}
