import { pick } from '@/lib/lang'
import { delay, read, uid, write } from '@/lib/storage'
import { getCachedApiUser, setCachedApiUser } from '@/lib/api'
import { KEYS, ensureDB } from './db'
import { pushNotification } from './notifications.service'
import { getSettingsSync } from './settings.service'
import type { FriendRequest, ID, User, UserSettings } from '@/types'

type IdMap = Record<ID, ID[]>

function requests(): FriendRequest[] {
  return read<FriendRequest[]>(KEYS.requests, [])
}

function idMap(key: string): IdMap {
  return read<IdMap>(KEYS[key as keyof typeof KEYS], {})
}

function idsFor(key: string, userId: ID): ID[] {
  return idMap(key)[userId] ?? []
}

function setIdsFor(key: string, userId: ID, ids: ID[]): void {
  const all = idMap(key)
  all[userId] = ids
  write(KEYS[key as keyof typeof KEYS], all)
}

export async function listUsers(): Promise<User[]> {
  ensureDB()
  await delay(120)
  return read<User[]>(KEYS.users, [])
}

export function getUser(id: string): User | undefined {
  ensureDB()
  const apiUser = getCachedApiUser()
  if (apiUser?.id === id) return apiUser
  return read<User[]>(KEYS.users, []).find((item) => item.id === id)
}

/**
 * One-time rescue for edits made before logout-safe persistence shipped: a live
 * session cache still holds them, so copy it into the durable account data.
 * The cached copy is the newest known state, so it wins over an older stored entry.
 */
export function persistCachedApiUser(): void {
  const apiUser = getCachedApiUser()
  if (!apiUser?.id) return
  ensureDB()
  const users = read<User[]>(KEYS.users, [])
  const index = users.findIndex((user) => user.id === apiUser.id)
  if (index === -1) users.push(apiUser)
  else users[index] = { ...users[index], ...apiUser }
  write(KEYS.users, users)
}

export function cacheApiUsers(apiUsers: User[]): void {
  if (apiUsers.length === 0) return
  ensureDB()
  const users = read<User[]>(KEYS.users, [])
  let changed = false

  apiUsers.forEach((apiUser) => {
    if (!apiUser.id) return
    const index = users.findIndex((user) => user.id === apiUser.id)
    if (index === -1) {
      users.push({ ...apiUser, joinedAt: apiUser.joinedAt || new Date().toISOString() })
      changed = true
      return
    }
    // Locally edited fields win over a later server sync, so refetching posts
    // cannot clobber profile edits made in the app.
    const updated = {
      ...apiUser,
      ...users[index],
      joinedAt: users[index].joinedAt || apiUser.joinedAt || new Date().toISOString(),
    }
    if (JSON.stringify(updated) !== JSON.stringify(users[index])) {
      users[index] = updated
      changed = true
    }
  })

  if (changed) write(KEYS.users, users)
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User> {
  ensureDB()
  await delay(450)
  const apiUser = getCachedApiUser()
  if (apiUser?.id === id) {
    const updated = { ...apiUser, ...patch, id }
    setCachedApiUser(updated)
    // Persist the edit outside the session cache so logging out does not erase it.
    const users = read<User[]>(KEYS.users, [])
    const index = users.findIndex((user) => user.id === id)
    if (index === -1) users.push(updated)
    else users[index] = { ...users[index], ...updated, id }
    write(KEYS.users, users)
    return updated
  }

  const users = read<User[]>(KEYS.users, [])
  const index = users.findIndex((user) => user.id === id)
  if (index === -1) throw new Error(pick('المستخدم غير موجود', 'User not found'))
  const updated = { ...users[index], ...patch, id }
  users[index] = updated
  write(KEYS.users, users)
  return updated
}

export function getFriendIds(userId: string): string[] {
  return requests()
    .filter((request) => request.status === 'accepted')
    .flatMap((request) => (request.fromId === userId ? [request.toId] : request.toId === userId ? [request.fromId] : []))
}

export function getFriends(userId: string): User[] {
  const ids = getFriendIds(userId)
  return read<User[]>(KEYS.users, []).filter((user) => ids.includes(user.id))
}

export function areFriends(a: string, b: string): boolean {
  return requests().some((request) =>
    request.status === 'accepted' &&
    ((request.fromId === a && request.toId === b) || (request.fromId === b && request.toId === a)))
}

export function getIncomingRequests(userId: string): FriendRequest[] {
  return requests().filter((request) => request.toId === userId && request.status === 'pending')
}

export function getOutgoingRequests(userId: string): FriendRequest[] {
  return requests().filter((request) => request.fromId === userId && request.status === 'pending')
}

export async function sendFriendRequest(fromId: string, toId: string): Promise<void> {
  ensureDB()
  await delay(350)
  if (fromId === toId) throw new Error(pick('لا يمكنك إرسال طلب لنفسك', 'You cannot send a request to yourself'))
  if (isBlocked(fromId, toId) || isBlocked(toId, fromId)) {
    throw new Error(pick('لا يمكنك إرسال طلب صداقة لهذا المستخدم', 'You cannot send this user a friend request'))
  }
  const settings = getSettingsSync(toId) as UserSettings
  if (settings.privateAccount && !areFriends(fromId, toId)) {
    throw new Error(pick('هذا الحساب خاص ولا يقبل طلبات صداقة من الغرباء', 'This account is private and is not accepting requests from strangers'))
  }
  const all = requests()
  const existing = all.find((request) =>
    (request.fromId === fromId && request.toId === toId) || (request.fromId === toId && request.toId === fromId))
  if (existing?.status === 'accepted') throw new Error(pick('أنتما صديقان بالفعل', 'You are already friends'))
  if (existing?.status === 'pending') throw new Error(pick('يوجد طلب صداقة قيد الانتظار بالفعل', 'A friend request is already pending'))

  all.push({ id: uid('fr'), fromId, toId, status: 'pending', createdAt: new Date().toISOString() })
  write(KEYS.requests, all)
  pushNotification({ userId: toId, type: 'friend', actorId: fromId, text: 'أرسل لك طلب صداقة', href: '/friends' })
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  ensureDB()
  await delay(300)
  const all = requests()
  const request = all.find((item) => item.id === requestId)
  if (!request) throw new Error(pick('الطلب غير موجود', 'Request not found'))
  request.status = 'accepted'
  write(KEYS.requests, all)
  pushNotification({
    userId: request.fromId, type: 'friend', actorId: request.toId,
    text: 'قبل طلب الصداقة الخاص بك 🎉', href: '/friends',
  })
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  ensureDB()
  await delay(250)
  write(KEYS.requests, requests().filter((item) => item.id !== requestId))
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  ensureDB()
  await delay(300)
  write(KEYS.requests, requests().filter((request) =>
    !(request.status === 'accepted' &&
      ((request.fromId === userId && request.toId === friendId) || (request.fromId === friendId && request.toId === userId)))))
  if (isFollowing(userId, friendId)) await unfollowUser(userId, friendId)
}

export function searchUsers(query: string, excludeId?: string): User[] {
  const q = query.trim().toLowerCase()
  const blocked = new Set(excludeId ? idsFor(KEYS.blocks, excludeId) : [])
  return read<User[]>(KEYS.users, [])
    .filter((user) => user.id !== excludeId && !blocked.has(user.id))
    .filter((user) => !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.bio.toLowerCase().includes(q))
}

// --- Follows ----------------------------------------------------------------

export function getFollowingIds(userId: ID): ID[] {
  return idsFor(KEYS.follows, userId)
}

export function getFollowerIds(userId: ID): ID[] {
  const all = idMap(KEYS.follows)
  return Object.entries(all)
    .filter(([, followed]) => followed.includes(userId))
    .map(([follower]) => follower)
}

export function getFollowing(userId: ID): User[] {
  return getFollowingIds(userId).map((id) => getUser(id)).filter((user): user is User => !!user)
}

export function getFollowers(userId: ID): User[] {
  return getFollowerIds(userId).map((id) => getUser(id)).filter((user): user is User => !!user)
}

export function isFollowing(followerId: ID, targetId: ID): boolean {
  return getFollowingIds(followerId).includes(targetId)
}

export async function toggleFollow(followerId: ID, targetId: ID): Promise<boolean> {
  ensureDB()
  await delay(220)
  if (followerId === targetId) throw new Error(pick('لا يمكنك متابعة نفسك', 'You cannot follow yourself'))
  const following = getFollowingIds(followerId)
  const next = following.includes(targetId)
    ? following.filter((id) => id !== targetId)
    : [...following, targetId]
  setIdsFor(KEYS.follows, followerId, next)
  if (!following.includes(targetId)) {
    pushNotification({ userId: targetId, type: 'friend', actorId: followerId, text: 'بدأ بمتابعتك', href: `/profile/${followerId}` })
  }
  return next.includes(targetId)
}

export async function followUser(followerId: ID, targetId: ID): Promise<void> {
  if (!isFollowing(followerId, targetId)) await toggleFollow(followerId, targetId)
}

export async function unfollowUser(followerId: ID, targetId: ID): Promise<void> {
  if (isFollowing(followerId, targetId)) await toggleFollow(followerId, targetId)
}

// --- Block / mute / privacy --------------------------------------------------

export function getBlockedIds(userId: ID): ID[] {
  return idsFor(KEYS.blocks, userId)
}

export function getMutedIds(userId: ID): ID[] {
  return idsFor(KEYS.mutes, userId)
}

export function isBlocked(a: ID, b: ID): boolean {
  return getBlockedIds(a).includes(b) || getBlockedIds(b).includes(a)
}

export function isMuted(userId: ID, targetId: ID): boolean {
  return getMutedIds(userId).includes(targetId)
}

export async function blockUser(userId: ID, targetId: ID): Promise<void> {
  ensureDB()
  await delay(240)
  const blocked = getBlockedIds(userId)
  if (!blocked.includes(targetId)) setIdsFor(KEYS.blocks, userId, [...blocked, targetId])
  if (areFriends(userId, targetId)) await removeFriend(userId, targetId)
}

export async function unblockUser(userId: ID, targetId: ID): Promise<void> {
  ensureDB()
  setIdsFor(KEYS.blocks, userId, getBlockedIds(userId).filter((id) => id !== targetId))
}

export async function toggleMute(userId: ID, targetId: ID): Promise<boolean> {
  ensureDB()
  const muted = getMutedIds(userId)
  const next = muted.includes(targetId) ? muted.filter((id) => id !== targetId) : [...muted, targetId]
  setIdsFor(KEYS.mutes, userId, next)
  return next.includes(targetId)
}

export function canViewProfile(viewerId: ID, targetId: ID): boolean {
  if (viewerId === targetId) return true
  if (isBlocked(viewerId, targetId)) return false
  const settings = getSettingsSync(targetId)
  return !settings.privateAccount || areFriends(viewerId, targetId)
}

export function canMessage(viewerId: ID, targetId: ID): boolean {
  if (viewerId === targetId) return false
  if (isBlocked(viewerId, targetId)) return false
  const settings = getSettingsSync(targetId)
  return !settings.privateAccount || areFriends(viewerId, targetId)
}

export function isOnline(user?: User): boolean {
  if (!user?.lastSeen) return false
  return Date.now() - new Date(user.lastSeen).getTime() < 5 * 60_000
}
