import type { User } from '@/types'
import { pick } from '@/lib/lang'

const DEFAULT_API_BASE_URL = 'https://route-posts.routemisr.com'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export const API_TOKEN_KEY = 'tawasol:api-token'
export const API_USER_KEY = 'tawasol:api-user'

function isCachedApiUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'name' in value && typeof value.name === 'string' &&
    'email' in value && typeof value.email === 'string' &&
    'avatar' in value && typeof value.avatar === 'string' &&
    'bio' in value && typeof value.bio === 'string' &&
    'location' in value && typeof value.location === 'string' &&
    'work' in value && typeof value.work === 'string' &&
    'cover' in value && typeof value.cover === 'string' &&
    'joinedAt' in value && typeof value.joinedAt === 'string'
}

/** Reads an expiry claim without verifying the signature. Only avoids using obviously stale tokens. */
function tokenExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const payload = JSON.parse(decoded) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** Tokens live in session storage so they disappear when the browser tab is closed. */
function readToken(): string | null {
  const sessionToken = sessionStorage.getItem(API_TOKEN_KEY)
  if (sessionToken) return sessionToken
  const legacyToken = localStorage.getItem(API_TOKEN_KEY)
  if (legacyToken) {
    sessionStorage.setItem(API_TOKEN_KEY, legacyToken)
    localStorage.removeItem(API_TOKEN_KEY)
    return legacyToken
  }
  return null
}

export function getCachedApiUser(): User | null {
  const cached = localStorage.getItem(API_USER_KEY)
  if (!cached) return null

  try {
    const user: unknown = JSON.parse(cached)
    if (isCachedApiUser(user)) return user
  } catch {
    localStorage.removeItem(API_USER_KEY)
    return null
  }

  localStorage.removeItem(API_USER_KEY)
  return null
}

export function setCachedApiUser(user: User): void {
  try {
    localStorage.setItem(API_USER_KEY, JSON.stringify(user))
  } catch (error) {
    const isQuotaError = error instanceof DOMException && (
      error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
    throw new Error(isQuotaError
      ? pick('مساحة التخزين في المتصفح ممتلئة. احذف بعض الصور أو امسح بيانات تجريبية ثم حاول مرة أخرى.', 'Browser storage is full. Remove some photos or reset the demo data, then try again.')
      : pick('تعذّر حفظ البيانات في المتصفح. تأكد من السماح بالتخزين المحلي ثم حاول مرة أخرى.', 'Could not save data in the browser. Make sure local storage is allowed and try again.'), { cause: error })
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tawasol:changed', { detail: { key: API_USER_KEY } }))
  }
}

export function getApiToken(): string | null {
  const token = readToken()
  if (!token) return null
  const expiry = tokenExpiry(token)
  if (expiry !== null && expiry <= Date.now()) {
    clearApiSession()
    return null
  }
  return token
}

export function setApiToken(token: string | null): void {
  localStorage.removeItem(API_TOKEN_KEY)
  if (token) sessionStorage.setItem(API_TOKEN_KEY, token)
  else sessionStorage.removeItem(API_TOKEN_KEY)
}

export function clearApiSession(): void {
  setApiToken(null)
  localStorage.removeItem(API_USER_KEY)
  sessionStorage.removeItem(API_USER_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tawasol:changed', { detail: { key: 'session' } }))
  }
}

interface ApiEnvelope<T> {
  success?: boolean
  message?: string
  data?: T
  errors?: unknown
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const result = await apiRequestWithMeta<T>(path, options)
  return result.data
}

export interface ApiResult<T> {
  data: T
  meta?: Record<string, unknown>
  message?: string
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const token = getApiToken()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  let payload: ApiEnvelope<T> | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>
    } catch {
      throw new Error(text)
    }
  }

  if (response.status === 401) clearApiSession()

  if (!response.ok || payload?.success === false) {
    const details = payload?.errors
    const errorMessage = Array.isArray(details)
      ? details.join(', ')
      : typeof details === 'string'
        ? details
        : payload?.message
    throw new Error(errorMessage || `API request failed (${response.status})`)
  }

  return {
    data: (payload?.data ?? payload ?? null) as T,
    meta: payload && typeof payload === 'object' && 'meta' in payload
      ? payload.meta as Record<string, unknown>
      : undefined,
    message: payload?.message,
  }
}
