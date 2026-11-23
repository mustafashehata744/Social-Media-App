import type { CSSProperties } from 'react'

/** Accepts only image-like URLs. Blocks javascript:, vbscript:, and malformed CSS values. */
export function isImageSource(value?: string): boolean {
  if (!value) return false
  const source = value.trim()
  if (/^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)[;,]/i.test(source)) return true
  if (/^https?:\/\//i.test(source)) {
    try {
      const url = new URL(source)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }
  if (/^blob:/i.test(source)) return true
  if (/^\/(?!\/)/.test(source)) return true
  if (/^\.\.?\//.test(source)) return true
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(source)
}

/** Escapes characters that could break out of a CSS url() string. */
export function safeImageUrl(value?: string): string | undefined {
  if (!isImageSource(value)) return undefined
  return value!.replace(/["'\\()]/g, (character) => encodeURIComponent(character))
}

export function coverStyle(cover?: string): CSSProperties {
  const safe = safeImageUrl(cover)
  return safe
    ? { backgroundImage: `url("${safe}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
}

export function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function truncate(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function extractTags(text: string): string[] {
  const matches = text.match(/(?:^|\s)#([\p{L}\p{N}_]{2,40})/gu) ?? []
  return [...new Set(matches.map((match) => match.trim().slice(1).toLowerCase()))]
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@([\p{L}\p{N}_]{2,40})/gu) ?? []
  return [...new Set(matches.map((match) => match.slice(1).toLowerCase()))]
}

export function formatCount(count: number, language: 'ar' | 'en' = 'ar'): string {
  const suffix = language === 'ar' ? 'ألف' : 'k'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)} ${suffix}`.trim()
  return String(count)
}

export function isScheduleActive(start: string, end: string, now = new Date()): boolean {
  const minutes = now.getHours() * 60 + now.getMinutes()
  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number)
    return (hour || 0) * 60 + (minute || 0)
  }
  const from = toMinutes(start)
  const until = toMinutes(end)
  return from <= until ? minutes >= from && minutes < until : minutes >= from || minutes < until
}

export const AVATAR_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-violet-400 to-purple-600',
  'from-cyan-400 to-indigo-600',
]

export function gradientFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}
