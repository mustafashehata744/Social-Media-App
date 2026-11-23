import { Bell, Home, MessageCircle, UserRound, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { unreadCount } from '@/services/notifications.service'
import { unreadMessagesCount } from '@/services/messages.service'
import { useDataVersion } from '@/hooks/useDataVersion'
import { cn } from '@/lib/utils'

export default function MobileNav() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const version = useDataVersion()
  const notices = user ? unreadCount(user.id) : 0
  const messages = user ? unreadMessagesCount(user.id) : 0

  const items = [
    { to: '/feed', icon: Home, label: t('الرئيسية', 'Home') },
    { to: '/friends', icon: Users, label: t('الأصدقاء', 'Friends') },
    { to: '/messages', icon: MessageCircle, label: t('الرسائل', 'Messages'), count: messages },
    { to: '/notifications', icon: Bell, label: t('الإشعارات', 'Notifications'), count: notices },
    { to: user ? `/profile/${user.id}` : '/feed', icon: UserRound, label: t('بروفايلي', 'Profile') },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" data-version={version}>
      <div className="grid grid-cols-5">
        {items.map(({ to, icon: Icon, label, count }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => cn(
              'relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition',
              isActive ? 'text-primary' : 'text-muted',
            )}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={2} />
              {!!count && count > 0 && (
                <span className="absolute -left-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-0.5 text-[9px] text-white">
                  {count > 9 ? '٩+' : count}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
