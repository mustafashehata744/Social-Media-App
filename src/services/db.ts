import { clearAll, read, write } from '@/lib/storage'
import { clearApiSession } from '@/lib/api'
import { DEMO_PASSWORD } from '@/data/demo'
import { hashPassword } from '@/lib/security'
import {
  defaultSettings, seedConversations, seedFriendRequests, seedNotifications, seedPosts, seedStories, seedUsers,
} from '@/data/seed'
import type {
  AppNotification, Conversation, Credential, FriendRequest, Post, Report,
  SearchEntry, Story, User, UserSettings,
} from '@/types'

export const KEYS = {
  users: 'users',
  credentials: 'credentials',
  passwordResets: 'password-resets',
  posts: 'posts',
  requests: 'friend-requests',
  conversations: 'conversations',
  notifications: 'notifications',
  stories: 'stories',
  hiddenPosts: 'hidden-posts',
  hiddenComments: 'hidden-comments',
  reactionOverrides: 'reaction-overrides',
  deletedPosts: 'deleted-posts',
  bookmarks: 'bookmarks',
  follows: 'follows',
  blocks: 'blocks',
  mutes: 'mutes',
  reports: 'reports',
  searchHistory: 'search-history',
  drafts: 'drafts',
  settings: 'settings',
  session: 'session',
} as const

let initialized = false

export function ensureDB(): void {
  if (initialized) return
  if (read<User[] | null>(KEYS.users, null) === null) write(KEYS.users, seedUsers)
  if (read<Credential[] | null>(KEYS.credentials, null) === null) {
    write(KEYS.credentials, seedUsers.map((user) => ({
      userId: user.id,
      salt: 'tawasol-demo-v1',
      hash: hashPassword(DEMO_PASSWORD),
    })))
  }
  if (read<unknown[] | null>(KEYS.passwordResets, null) === null) write(KEYS.passwordResets, [])
  if (read<Post[] | null>(KEYS.posts, null) === null) write(KEYS.posts, seedPosts)
  if (read<FriendRequest[] | null>(KEYS.requests, null) === null) write(KEYS.requests, seedFriendRequests)
  if (read<Conversation[] | null>(KEYS.conversations, null) === null) write(KEYS.conversations, seedConversations)
  if (read<AppNotification[] | null>(KEYS.notifications, null) === null) write(KEYS.notifications, seedNotifications)
  if (read<Story[] | null>(KEYS.stories, null) === null) write(KEYS.stories, seedStories)
  if (read<Report[] | null>(KEYS.reports, null) === null) write(KEYS.reports, [])
  if (read<SearchEntry[] | null>(KEYS.searchHistory, null) === null) write(KEYS.searchHistory, [])

  // One-time cleanup: strip withdrawn demo photos from previously seeded browsers
  const storedPosts = read<Post[]>(KEYS.posts, [])
  let postsDirty = false
  const cleanedPosts = storedPosts.map((post) => {
    const images = (post.images ?? []).filter((src) => !src.includes('demo-post-'))
    const image = post.image && post.image.includes('demo-post-') ? undefined : post.image
    if (images.length === (post.images ?? []).length && image === post.image) return post
    postsDirty = true
    return { ...post, images, image }
  })
  if (postsDirty) write(KEYS.posts, cleanedPosts)

  const users = read<User[]>(KEYS.users, [])
  const settings = read<Record<string, UserSettings>>(KEYS.settings, {})
  users.forEach((user) => {
    if (!settings[user.id]) settings[user.id] = defaultSettings(user.id)
  })
  write(KEYS.settings, settings)
  initialized = true
}

export function resetDB(): void {
  clearApiSession()
  clearAll()
  initialized = false
  ensureDB()
}
