import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Heart, MessageCircle, Share2, Sparkles, Trash2, UserPlus } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { relativeTime } from '@/lib/storage'
import { cn } from '@/lib/utils'
import {
  clearNotifications, listNotifications, markAllRead, markNotificationRead,
} from '@/services/notifications.service'
import { getUser } from '@/services/users.service'
import type { AppNotification, NotificationType } from '@/types'

const icons: Record<NotificationType, typeof Bell> = {
  like: Heart, comment: MessageCircle, friend: UserPlus,
  message: MessageCircle, share: Share2, system: Sparkles,
}
const colors: Record<NotificationType, string> = {
  like: 'text-rose-500 bg-rose-500/10', comment: 'text-primary bg-primary-soft',
  friend: 'text-emerald-500 bg-emerald-500/10', message: 'text-violet-500 bg-violet-500/10',
  share: 'text-amber-500 bg-amber-500/10', system: 'text-primary bg-primary-soft',
}

function englishNotificationText(item: AppNotification): string {
  switch (item.type) {
    case 'like': return 'liked your post'
    case 'comment': {
      const comment = item.text.match(/«(.*)»/)?.[1]
      return comment ? `commented on your post: “${comment}”` : 'commented on your post'
    }
    case 'friend': return item.text.startsWith('قبل') ? 'accepted your friend request 🎉' : 'sent you a friend request'
    case 'message': return 'sent you a new message'
    case 'share': return 'shared your post'
    case 'system': return 'Welcome to Tawasol! Explore friends and start sharing 🎉'
  }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const version = useDataVersion()
  const [items, setItems] = useState<AppNotification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    listNotifications(userId).then(setItems)
  }, [userId, version])

  if (!user) return null
  const visible = filter === 'unread' ? items.filter((item) => !item.read) : items
  const unread = items.filter((item) => !item.read).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t('الإشعارات', 'Notifications')}</h1>
          <p className="text-xs text-muted">{unread > 0 ? (language === 'ar' ? `لديك ${unread} إشعار غير مقروء` : `You have ${unread} unread notification${unread === 1 ? '' : 's'}`) : t('كل شيء محدث', 'You’re all caught up')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await markAllRead(user.id); setItems(await listNotifications(user.id)); toast(t('تم تحديد الكل كمقروء', 'Marked all as read')) }} className="btn-ghost !px-3 !py-2 !text-xs" disabled={unread === 0}>
            <CheckCheck size={15} /> {t('تحديد الكل', 'Mark all read')}
          </button>
          <button onClick={async () => { await clearNotifications(user.id); setItems([]); toast(t('تم مسح الإشعارات', 'Notifications cleared')) }} className="btn-outline !px-3 !py-2 !text-xs" disabled={items.length === 0}>
            <Trash2 size={15} /> {t('مسح', 'Clear')}
          </button>
        </div>
      </div>

      <div className="card flex border-b border-line">
        {([['all', t('الكل', 'All')], ['unread', `${t('غير المقروءة', 'Unread')} (${unread})`]] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn('flex-1 border-b-2 px-2 py-3 text-xs font-bold transition sm:text-sm', filter === value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Bell} title={t('لا توجد إشعارات', 'No notifications')} description={filter === 'unread' ? t('قرأت كل الإشعارات، أحسنت!', 'You’ve read all your notifications!') : t('ستظهر الإشعارات هنا عند تفاعل أصدقائك معك', 'Notifications will appear here when friends interact with you')} />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {visible.map((item) => {
            const Icon = icons[item.type]
            const actor = item.actorId ? getUser(item.actorId) : null
            const content = (
              <div className={cn('flex items-center gap-3 p-3 transition hover:bg-surface-2 sm:p-4', !item.read && 'bg-primary-soft/40')}>
                <div className="relative shrink-0">
                  {actor ? <Avatar user={actor} size="md" /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={20} /></span>}
                  <span className={cn('absolute -bottom-1 -left-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-surface', colors[item.type])}><Icon size={12} /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-ink"><span className="font-extrabold">{actor?.name ?? 'Tawasol'}</span> {language === 'en' ? englishNotificationText(item) : item.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{relativeTime(item.createdAt, language)}</p>
                </div>
                {!item.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
              </div>
            )
            return item.href ? (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => { void markNotificationRead(item.id) }}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
