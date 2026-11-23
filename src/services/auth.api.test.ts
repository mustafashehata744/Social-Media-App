import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDB } from './db'
import { getCurrentUser, isApiMode, loginWithApi, logout, registerWithApi } from './auth.service'
import { API_TOKEN_KEY, getApiToken } from '@/lib/api'

const apiUser = {
  id: 'api-1',
  name: 'Mustafa',
  email: 'mustafa@example.com',
  profilePhoto: 'data:image/jpeg;base64,photo',
}

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetDB()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth.service API path', () => {
  it('logs in through the API, stores the token in sessionStorage, and exposes the API user', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200, { token: 'api-token-1', user: apiUser }))

    const user = await loginWithApi('mustafa@example.com', 'Secret1!')

    expect(user.id).toBe('api-1')
    expect(getApiToken()).toBe('api-token-1')
    expect(sessionStorage.getItem(API_TOKEN_KEY)).toBe('api-token-1')
    expect(localStorage.getItem(API_TOKEN_KEY)).toBeNull()
    expect(getCurrentUser()?.id).toBe('api-1')
    expect(isApiMode()).toBe(true)

    logout()
    expect(getApiToken()).toBeNull()
    expect(getCurrentUser()).toBeNull()
    expect(isApiMode()).toBe(false)
  })

  it('rejects when the server returns no token', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200, { user: apiUser }))

    await expect(loginWithApi('mustafa@example.com', 'Secret1!')).rejects.toThrow()
    expect(getApiToken()).toBeNull()
  })

  it('propagates server error messages', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(401, { message: 'invalid credentials' }))

    await expect(loginWithApi('mustafa@example.com', 'wrong')).rejects.toThrow('invalid credentials')
    expect(getApiToken()).toBeNull()
  })

  it('registers through the API and starts an API session', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200, { token: 'api-token-2', user: apiUser }))

    const user = await registerWithApi({
      name: 'Mustafa',
      email: 'mustafa@example.com',
      password: 'Secret1!',
      confirmPassword: 'Secret1!',
      dateOfBirth: '2005-06-12',
      gender: 'male',
    })

    expect(user.id).toBe('api-1')
    expect(getApiToken()).toBe('api-token-2')
    expect(isApiMode()).toBe(true)
  })

  it('keeps profile edits across logout and a fresh API login', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200, { token: 'api-token-1', user: apiUser }))

    await loginWithApi('mustafa@example.com', 'Secret1!')
    const { updateUser } = await import('./users.service')
    await updateUser('api-1', { bio: 'مطور واجهات', work: 'طالب' })

    logout()
    expect(getCurrentUser()).toBeNull()

    const user = await loginWithApi('mustafa@example.com', 'Secret1!')
    expect(user.bio).toBe('مطور واجهات')
    expect(user.work).toBe('طالب')
    expect(user.name).toBe('Mustafa')
  })

  it('rescues edits still sitting in a live session cache from before the fix', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200, { token: 'api-token-1', user: apiUser }))
    await loginWithApi('mustafa@example.com', 'Secret1!')

    // Simulates a pre-fix edit: present only in the session cache, never persisted.
    const { getCachedApiUser, setCachedApiUser, API_USER_KEY } = await import('@/lib/api')
    const cached = getCachedApiUser()!
    setCachedApiUser({ ...cached, bio: 'تعديل قبل الإصلاح' })
    expect(JSON.parse(localStorage.getItem('tawasol:users') || '[]')
      .find((item: { id: string }) => item.id === 'api-1')).toBeUndefined()

    // Any app load (getCurrentUser) now copies the live cache into durable storage.
    expect(getCurrentUser()?.bio).toBe('تعديل قبل الإصلاح')
    expect(JSON.parse(localStorage.getItem('tawasol:users') || '[]')
      .find((item: { id: string }) => item.id === 'api-1')?.bio).toBe('تعديل قبل الإصلاح')

    logout()
    expect(localStorage.getItem(API_USER_KEY)).toBeNull()

    const user = await loginWithApi('mustafa@example.com', 'Secret1!')
    expect(user.bio).toBe('تعديل قبل الإصلاح')
  })
})
