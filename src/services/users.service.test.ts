import { beforeEach, describe, expect, it } from 'vitest'
import { API_USER_KEY, setCachedApiUser } from '@/lib/api'
import type { User } from '@/types'
import { resetDB } from './db'
import { getUser, updateUser, cacheApiUsers } from './users.service'

beforeEach(() => {
  localStorage.clear()
  resetDB()
})

describe('users.service', () => {
  it('resolves the signed-in API user by id', () => {
    const apiUser: User = {
      id: 'api-user-1',
      name: 'New Member',
      email: 'new@example.com',
      avatar: 'avatar.jpg',
      bio: '',
      location: '',
      work: '',
      cover: 'from-teal-400 to-cyan-600',
      joinedAt: '2026-11-22T00:00:00.000Z',
    }
    localStorage.setItem(API_USER_KEY, JSON.stringify(apiUser))

    expect(getUser(apiUser.id)).toEqual(apiUser)
  })

  it('still resolves seeded users when an API user is cached', () => {
    localStorage.setItem(API_USER_KEY, JSON.stringify({
      id: 'api-user-1',
      name: 'New Member',
      email: 'new@example.com',
      avatar: 'avatar.jpg',
      bio: '',
      location: '',
      work: '',
      cover: 'from-teal-400 to-cyan-600',
      joinedAt: '2026-11-22T00:00:00.000Z',
    }))

    expect(getUser('u1')?.email).toBe('ahmed@tawasol.com')
  })

  it('saves profile edits for the cached API user', async () => {
    const apiUser: User = {
      id: 'api-user-1',
      name: 'New Member',
      email: 'new@example.com',
      avatar: 'avatar.jpg',
      bio: '',
      location: '',
      work: '',
      cover: 'from-teal-400 to-cyan-600',
      joinedAt: '2026-11-22T00:00:00.000Z',
    }
    setCachedApiUser(apiUser)

    const updated = await updateUser(apiUser.id, {
      name: 'Updated Member',
      avatar: 'data:image/jpeg;base64,abc',
    })

    expect(updated.name).toBe('Updated Member')
    expect(updated.avatar).toBe('data:image/jpeg;base64,abc')
    expect(getUser(apiUser.id)).toEqual(updated)
  })

  it('keeps API-user profile edits after the session cache is cleared', async () => {
    const apiUser: User = {
      id: 'api-user-1',
      name: 'New Member',
      email: 'new@example.com',
      avatar: 'avatar.jpg',
      bio: '',
      location: '',
      work: '',
      cover: 'from-teal-400 to-cyan-600',
      joinedAt: '2026-11-22T00:00:00.000Z',
    }
    setCachedApiUser(apiUser)

    await updateUser(apiUser.id, { bio: 'مطور واجهات', work: 'طالب' })

    // Simulates logout: only the session cache goes away.
    localStorage.removeItem(API_USER_KEY)
    expect(getUser(apiUser.id)).toMatchObject({ bio: 'مطور واجهات', work: 'طالب' })
  })

  it('does not let a later server sync overwrite locally edited fields', async () => {
    const apiUser: User = {
      id: 'api-user-1',
      name: 'New Member',
      email: 'new@example.com',
      avatar: 'avatar.jpg',
      bio: '',
      location: '',
      work: '',
      cover: 'from-teal-400 to-cyan-600',
      joinedAt: '2026-11-22T00:00:00.000Z',
    }
    setCachedApiUser(apiUser)
    await updateUser(apiUser.id, { bio: 'مطور واجهات' })

    cacheApiUsers([{ ...apiUser, bio: 'stale server bio' }])

    localStorage.removeItem(API_USER_KEY)
    expect(getUser(apiUser.id)?.bio).toBe('مطور واجهات')
  })
})
