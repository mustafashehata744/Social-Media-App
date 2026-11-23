import { read, write } from '@/lib/storage'
import { KEYS, ensureDB } from './db'
import { getPostsByHashtag, getTrendingTags, searchPosts } from './posts.service'
import { searchUsers } from './users.service'
import type { Post, SearchEntry, User } from '@/types'

export interface SearchResults {
  users: User[]
  posts: Post[]
  tags: Array<{ tag: string; count: number }>
}

export function globalSearch(query: string, excludeUserId?: string): SearchResults {
  const q = query.trim()
  if (!q) return { users: [], posts: [], tags: getTrendingTags() }
  return {
    users: searchUsers(q, excludeUserId).slice(0, 8),
    posts: searchPosts(q).slice(0, 10),
    tags: getTrendingTags().filter((item) => item.tag.includes(q.replace(/^#/, '').toLowerCase())),
  }
}

export function hashtagSearch(tag: string): Post[] {
  return getPostsByHashtag(tag)
}

export function getRecentSearches(limit = 6): string[] {
  ensureDB()
  return read<SearchEntry[]>(KEYS.searchHistory, [])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((item) => item.query)
}

export function saveSearch(query: string): void {
  const q = query.trim()
  if (!q) return
  const history = read<SearchEntry[]>(KEYS.searchHistory, [])
  write(KEYS.searchHistory, [
    { query: q, createdAt: new Date().toISOString() },
    ...history.filter((item) => item.query.toLowerCase() !== q.toLowerCase()),
  ].slice(0, 20))
}

export function clearRecentSearches(): void {
  write(KEYS.searchHistory, [])
}
