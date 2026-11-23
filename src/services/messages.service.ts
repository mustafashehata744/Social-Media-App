import { pick } from '@/lib/lang'
import { delay, read, uid, write, writeSilently } from '@/lib/storage'
import { KEYS, ensureDB } from './db'
import { pushNotification } from './notifications.service'
import { canMessage } from './users.service'
import type { Conversation, ID, Message } from '@/types'

const TYPING_EVENT = 'tawasol:typing'
const typing = new Map<ID, Set<ID>>()

function conversations(): Conversation[] {
  return read<Conversation[]>(KEYS.conversations, [])
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  ensureDB()
  await delay(160)
  return conversations()
    .filter((conversation) => conversation.participantIds.includes(userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getConversation(id: string): Conversation | undefined {
  return conversations().find((item) => item.id === id)
}

export function getOrCreateConversation(a: string, b: string): Conversation {
  ensureDB()
  if (!canMessage(a, b)) {
    throw new Error(pick('لا يمكنك مراسلة هذا المستخدم', 'You cannot message this user'))
  }
  const all = conversations()
  const existing = all.find((c) => c.participantIds.includes(a) && c.participantIds.includes(b))
  if (existing) return existing
  const conversation: Conversation = {
    id: uid('conv'), participantIds: [a, b], messages: [], updatedAt: new Date().toISOString(),
  }
  write(KEYS.conversations, [conversation, ...all])
  return conversation
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
  ensureDB()
  await delay(220)
  const all = conversations()
  const conversation = all.find((item) => item.id === conversationId)
  if (!conversation) throw new Error(pick('المحادثة غير موجودة', 'Conversation not found'))
  const recipientId = conversation.participantIds.find((id) => id !== senderId)
  if (recipientId && !canMessage(senderId, recipientId)) {
    throw new Error(pick('لا يمكنك مراسلة هذا المستخدم', 'You cannot message this user'))
  }
  const message: Message = {
    id: uid('m'), senderId, text: text.trim(), createdAt: new Date().toISOString(), read: false,
  }
  conversation.messages.push(message)
  conversation.updatedAt = message.createdAt
  write(KEYS.conversations, all)

  if (recipientId) {
    pushNotification({ userId: recipientId, type: 'message', actorId: senderId, text: 'أرسل لك رسالة جديدة', href: '/messages' })
    scheduleDemoReceipt(conversationId, message.id)
  }
  return message
}

/** Simulated demo delivery/read receipts. A real app receives these over a socket. */
function scheduleDemoReceipt(conversationId: string, messageId: string): void {
  window.setTimeout(() => {
    const all = conversations()
    const conversation = all.find((item) => item.id === conversationId)
    const message = conversation?.messages.find((item) => item.id === messageId)
    if (!message) return
    message.deliveredAt = new Date().toISOString()
    writeSilently(KEYS.conversations, all)
  }, 700)
  window.setTimeout(() => {
    const all = conversations()
    const conversation = all.find((item) => item.id === conversationId)
    const message = conversation?.messages.find((item) => item.id === messageId)
    if (!message || message.read) return
    message.read = true
    message.readAt = new Date().toISOString()
    writeSilently(KEYS.conversations, all)
    window.dispatchEvent(new CustomEvent('tawasol:changed', { detail: { key: KEYS.conversations } }))
  }, 2600)
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const all = conversations()
  const conversation = all.find((item) => item.id === conversationId)
  if (!conversation) return
  let changed = false
  conversation.messages.forEach((message) => {
    if (!message.read) { message.read = true; message.readAt = new Date().toISOString(); changed = true }
  })
  if (changed) write(KEYS.conversations, all)
}

export function unreadMessagesCount(userId: string): number {
  return conversations()
    .filter((c) => c.participantIds.includes(userId))
    .reduce((total, c) => total + c.messages.filter((m) => m.senderId !== userId && !m.read).length, 0)
}

// --- Typing indicators (in-memory, demo) ------------------------------------

export function setTyping(conversationId: string, userId: ID, isTyping: boolean): void {
  const users = typing.get(conversationId) ?? new Set<ID>()
  if (isTyping) users.add(userId)
  else users.delete(userId)
  typing.set(conversationId, users)
  window.dispatchEvent(new CustomEvent(TYPING_EVENT, { detail: { conversationId } }))
}

export function getTyping(conversationId: string): ID[] {
  return [...(typing.get(conversationId) ?? [])]
}

export function subscribeTyping(callback: () => void): () => void {
  window.addEventListener(TYPING_EVENT, callback)
  return () => window.removeEventListener(TYPING_EVENT, callback)
}
