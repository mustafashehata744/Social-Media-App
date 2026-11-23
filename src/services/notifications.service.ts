import { delay, read, uid, write } from '@/lib/storage'
import { KEYS, ensureDB } from './db'
import type { AppNotification, NotificationType, UserSettings } from '@/types'

const settingFor: Partial<Record<NotificationType, keyof UserSettings>> = {
  like: 'notifyLikes',
  share: 'notifyLikes',
  comment: 'notifyComments',
  friend: 'notifyFriends',
  message: 'notifyMessages',
}

interface PushInput {
  userId: string
  type: NotificationType
  text: string
  actorId?: string
  href?: string
}

export function pushNotification(input: PushInput): AppNotification | null {
  const key = settingFor[input.type]
  const allSettings = read<Record<string, UserSettings>>(KEYS.settings, {})
  const settings = allSettings[input.userId]
  if (key && settings && settings[key] === false) return null

  const notifications = read<AppNotification[]>(KEYS.notifications, [])
  const notification: AppNotification = {
    id: uid('n'),
    ...input,
    createdAt: new Date().toISOString(),
    read: false,
  }
  write(KEYS.notifications, [notification, ...notifications])
  if (settings?.pushNotifications) {
    showBrowserNotification('تواصل', notification.text, notification.href)
  }
  return notification
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission
  return Notification.requestPermission()
}

export function showBrowserNotification(title: string, body: string, href?: string): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const notification = new Notification(title, { body, icon: '/icons/icon.svg', tag: href ?? 'tawasol' })
  if (href) {
    notification.onclick = () => {
      window.focus()
      window.location.assign(href)
      notification.close()
    }
  }
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  ensureDB()
  await delay(150)
  return read<AppNotification[]>(KEYS.notifications, [])
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function unreadCount(userId: string): number {
  return read<AppNotification[]>(KEYS.notifications, []).filter((item) => item.userId === userId && !item.read).length
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay(80)
  const notifications = read<AppNotification[]>(KEYS.notifications, [])
  const target = notifications.find((item) => item.id === id)
  if (target) target.read = true
  write(KEYS.notifications, notifications)
}

export async function markAllRead(userId: string): Promise<void> {
  await delay(180)
  const notifications = read<AppNotification[]>(KEYS.notifications, [])
  notifications.forEach((item) => { if (item.userId === userId) item.read = true })
  write(KEYS.notifications, notifications)
}

export async function clearNotifications(userId: string): Promise<void> {
  await delay(200)
  write(KEYS.notifications, read<AppNotification[]>(KEYS.notifications, []).filter((item) => item.userId !== userId))
}
