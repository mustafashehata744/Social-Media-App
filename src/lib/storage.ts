import { pick } from './lang'

const PREFIX = 'tawasol:'

export const STORAGE_LIMIT = 4.5 * 1024 * 1024

export function storageBytes(): number {
  let total = 0
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
    if (key?.startsWith(PREFIX)) total += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2
  }
  return total
}

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tawasol:changed', { detail: { key } }))
    }
  } catch (error) {
    const isQuotaError = error instanceof DOMException && (
      error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
    throw new Error(isQuotaError
      ? pick('مساحة التخزين في المتصفح ممتلئة. احذف بعض الصور أو امسح بيانات تجريبية ثم حاول مرة أخرى.', 'Browser storage is full. Remove some photos or reset the demo data, then try again.')
      : pick('تعذّر حفظ البيانات في المتصفح. تأكد من السماح بالتخزين المحلي ثم حاول مرة أخرى.', 'Could not save data in the browser. Make sure local storage is allowed and try again.'), { cause: error })
  }
}

export function writeSilently<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    const isQuotaError = error instanceof DOMException && (
      error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
    throw new Error(isQuotaError
      ? pick('مساحة التخزين في المتصفح ممتلئة.', 'Browser storage is full.')
      : pick('تعذّر حفظ البيانات في المتصفح.', 'Could not save data in the browser.'), { cause: error })
  }
}

export function remove(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => localStorage.removeItem(key))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function delay(ms = 320): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function relativeTime(iso: string, language: 'ar' | 'en' = 'ar'): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return language === 'ar' ? 'الآن' : 'Just now'
  if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`
  if (days < 30) return language === 'ar' ? `منذ ${Math.floor(days / 7)} أسبوع` : `${Math.floor(days / 7)}w ago`
  return new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
