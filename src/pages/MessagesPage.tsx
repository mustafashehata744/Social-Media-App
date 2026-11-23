import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, MessageCircle, Search, Send } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import RichText from '@/components/ui/RichText'
import TypingDots from '@/components/ui/TypingDots'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { relativeTime } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { clearDraft, getDraft, saveDraft } from '@/services/drafts.service'
import { getUser, isOnline } from '@/services/users.service'
import {
  getConversation, getTyping, listConversations, markConversationRead, sendMessage,
  setTyping, subscribeTyping,
} from '@/services/messages.service'
import type { Conversation } from '@/types'

export default function MessagesPage() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const version = useDataVersion()
  const [params, setParams] = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(params.get('c'))
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [query, setQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | null>(null)
  const [typingIds, setTypingIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    listConversations(user.id).then(setConversations)
  }, [user, version])

  const selected = selectedId ? getConversation(selectedId) ?? null : null
  const active = selected?.participantIds.includes(user?.id ?? '') ? selected : null

  const activeId = active?.id
  const userId = user?.id
  const messageCount = active?.messages.length
  const draftKey = activeId ? `message:${activeId}:${userId ?? 'guest'}` : 'message:none'

  useEffect(() => { setText(getDraft(draftKey)) }, [draftKey])

  useEffect(() => {
    if (!activeId || !text.trim()) {
      clearDraft(draftKey)
      return
    }
    const timer = window.setTimeout(() => saveDraft(draftKey, text), 400)
    return () => window.clearTimeout(timer)
  }, [text, draftKey, activeId])

  useEffect(() => {
    if (!activeId) return
    const update = () => setTypingIds(getTyping(activeId).filter((id) => id !== userId))
    update()
    return subscribeTyping(update)
  }, [activeId, userId])

  useEffect(() => {
    return () => { if (typingTimer.current) window.clearTimeout(typingTimer.current) }
  }, [])

  useEffect(() => {
    if (!activeId || !userId) return
    const hasUnread = getConversation(activeId)?.messages.some((message) => message.senderId !== userId && !message.read)
    if (hasUnread) void markConversationRead(activeId)
  }, [activeId, userId, version])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messageCount, sending])

  if (!user) return null

  function select(id: string) {
    setSelectedId(id)
    setParams({ c: id })
  }

  function back() {
    setSelectedId(null)
    setParams({})
  }

  function stopTyping(conversationId: string) {
    if (!user) return
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    setTyping(conversationId, user.id, false)
  }

  function onTextChange(value: string) {
    setText(value)
    if (!active || !user || !value.trim()) {
      if (active) stopTyping(active.id)
      return
    }
    setTyping(active.id, user.id, true)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => stopTyping(active.id), 1400)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user || !text.trim() || !active || sending) return
    setSending(true)
    const value = text.trim()
    const conversation = active
    const otherId = conversation.participantIds.find((id) => id !== user.id)
    stopTyping(conversation.id)
    setText('')
    clearDraft(draftKey)
    try {
      await sendMessage(conversation.id, user.id, value)
      setConversations(await listConversations(user.id))
      if (otherId) {
        setTyping(conversation.id, otherId, true)
        window.setTimeout(() => setTyping(conversation.id, otherId, false), 1800)
      }
    } catch (error) {
      toast((error as Error).message, 'error')
      setText(value)
    } finally {
      setSending(false)
    }
  }

  const visible = conversations.filter((conversation) => {
    if (!query.trim()) return true
    const other = getUser(conversation.participantIds.find((id) => id !== user.id) ?? '')
    return other?.name.includes(query.trim()) || other?.email.includes(query.trim())
  })

  return (
    <div className="card flex h-[calc(100vh-8.5rem)] min-h-[480px] overflow-hidden">
      <aside className={cn('w-full shrink-0 flex-col border-line md:flex md:w-80 md:border-l', active ? 'hidden' : 'flex')}>
        <div className="border-b border-line p-3">
          <h1 className="mb-3 px-1 text-lg font-extrabold text-ink">{t('الرسائل', 'Messages')}</h1>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('ابحث في المحادثات', 'Search conversations')} className="input py-2 pr-9 text-xs" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 && <p className="p-5 text-center text-xs text-muted">{t('لا توجد محادثات', 'No conversations')}</p>}
          {visible.map((conversation) => {
            const otherId = conversation.participantIds.find((id) => id !== user.id) ?? ''
            const other = getUser(otherId)
            const last = conversation.messages.at(-1)
            const unread = conversation.messages.filter((message) => message.senderId !== user.id && !message.read).length
            return (
              <button
                key={conversation.id}
                onClick={() => select(conversation.id)}
                className={cn('flex w-full items-center gap-3 border-b border-line/60 p-3 text-right transition hover:bg-surface-2', active?.id === conversation.id && 'bg-primary-soft/70')}
              >
                <Avatar user={other} size="md" online />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-ink">{other?.name ?? t('مستخدم', 'User')}</p>
                    <span className="shrink-0 text-[10px] text-muted">{last ? relativeTime(last.createdAt, language) : ''}</span>
                  </div>
                  <p className="truncate text-xs text-muted">{last?.text || t('ابدأ المحادثة', 'Start a conversation')}</p>
                </div>
                {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{unread}</span>}
              </button>
            )
          })}
        </div>
      </aside>

      <section className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden md:flex')}>
        {!active ? (
          <div className="grid flex-1 place-items-center p-5">
            <EmptyState icon={MessageCircle} title={t('اختر محادثة', 'Choose a conversation')} description={t('اختر صديقًا من القائمة لتبدأ المحادثة', 'Select a friend to start chatting')} />
          </div>
        ) : (
          <>
            {(() => {
              const otherId = active.participantIds.find((id) => id !== user.id) ?? ''
              const other = getUser(otherId)
              return (
                <header className="flex items-center gap-3 border-b border-line p-3">
                  <button onClick={back} className="icon-btn md:hidden" aria-label={t('رجوع', 'Back')}><ArrowRight size={18} /></button>
                  <Link to={`/profile/${otherId}`}><Avatar user={other} size="sm" online={isOnline(other)} verified={other?.verified} /></Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${otherId}`} className="block truncate text-sm font-extrabold text-ink hover:text-primary">{other?.name ?? t('مستخدم', 'User')}</Link>
                    <p className={cn('text-[10px]', isOnline(other) ? 'text-emerald-500' : 'text-muted')}>
                      {typingIds.length > 0 ? t('بيكتب...', 'Typing...') : isOnline(other) ? t('متصل الآن', 'Online now') : t('غير متصل', 'Offline')}
                    </p>
                  </div>
                </header>
              )
            })()}

            <div className="flex-1 space-y-3 overflow-y-auto bg-surface-2/40 p-3 sm:p-5">
              {active.messages.length === 0 && <p className="mt-10 text-center text-xs text-muted">{t('قل أهلًا وابدأ المحادثة 👋', 'Say hello to start the conversation 👋')}</p>}
              {active.messages.map((message) => {
                const mine = message.senderId === user.id
                return (
                  <div key={message.id} className={cn('flex', mine ? 'justify-start' : 'justify-end')}>
                    <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-card sm:max-w-[65%]', mine ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm bg-surface text-ink')}>
                      <RichText text={message.text} className="block whitespace-pre-line text-sm leading-relaxed" />
                      <p className={cn('mt-1 flex items-center gap-1 text-left text-[9px]', mine ? 'text-white/70' : 'text-muted')}>
                        {relativeTime(message.createdAt, language)}
                        {mine && (message.read ? ` · ${t('مقروء ✓✓', 'Read ✓✓')}` : message.deliveredAt ? ` · ${t('تم التسليم ✓✓', 'Delivered ✓✓')}` : ' · ✓')}
                      </p>
                    </div>
                  </div>
                )
              })}
              {sending && <div className="flex justify-start"><TypingDots label={t('جارٍ الإرسال...', 'Sending...')} /></div>}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 border-t border-line p-3">
              <input value={text} onChange={(event) => onTextChange(event.target.value)} placeholder={t('اكتب رسالة...', 'Write a message...')} className="input flex-1 py-2.5" />
              <button type="submit" className="btn-primary h-11 w-11 !px-0" disabled={!text.trim() || sending} aria-label={t('إرسال الرسالة', 'Send message')}>
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
