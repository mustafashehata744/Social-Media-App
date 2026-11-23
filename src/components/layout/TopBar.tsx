import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, Bookmark, Home, LogOut, MessageCircle, Settings, Users, UserRound } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import Avatar from '@/components/ui/Avatar'
import CommandPalette from '@/components/ui/CommandPalette'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { unreadCount } from '@/services/notifications.service'
import { unreadMessagesCount } from '@/services/messages.service'
import { useDataVersion } from '@/hooks/useDataVersion'
import { cn } from '@/lib/utils'

const links = [
  { to: '/feed', icon: Home, label: ['الرئيسية', 'Home'] },
  { to: '/friends', icon: Users, label: ['الأصدقاء', 'Friends'] },
  { to: '/messages', icon: MessageCircle, label: ['الرسائل', 'Messages'] },
  { to: '/notifications', icon: Bell, label: ['الإشعارات', 'Notifications'] },
]

export default function TopBar() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const version = useDataVersion()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notices = user ? unreadCount(user.id) : 0
  const messages = user ? unreadMessagesCount(user.id) : 0

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:px-5">
        <NavLink to="/feed" className="shrink-0"><Logo /></NavLink>

        <div className="flex-1"><CommandPalette /></div>

        <div className="mr-auto hidden items-center gap-1.5 md:flex" data-version={version}>
          {links.map(({ to, icon: Icon, label: labels }) => {
            const label = t(labels[0], labels[1])
            return (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) => cn(
                'relative grid h-10 w-10 place-items-center rounded-xl transition',
                isActive ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted hover:text-ink',
              )}
            >
              <Icon size={20} />
              {to === '/messages' && messages > 0 && <Badge count={messages} />}
              {to === '/notifications' && notices > 0 && <Badge count={notices} />}
            </NavLink>
            )
          })}
        </div>

        <ThemeToggle className="hidden sm:grid" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full p-0.5 transition hover:bg-surface-2"
            aria-label={t('قائمة الحساب', 'Account menu')}
            aria-expanded={menuOpen}
          >
            <Avatar user={user} size="sm" verified={user.verified} />
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-full mt-2 w-60 animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-extrabold text-ink">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <div className="p-1.5">
                <MenuItem icon={UserRound} label={t('الملف الشخصي', 'Profile')} onClick={() => { setMenuOpen(false); navigate(`/profile/${user.id}`) }} />
                <MenuItem icon={Bookmark} label={t('المحفوظات', 'Saved')} onClick={() => { setMenuOpen(false); navigate('/saved') }} />
                <MenuItem icon={Settings} label={t('الإعدادات', 'Settings')} onClick={() => { setMenuOpen(false); navigate('/settings') }} />
                <MenuItem icon={LogOut} label={t('تسجيل الخروج', 'Sign out')} danger onClick={() => { setMenuOpen(false); logout(); navigate('/login') }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -left-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
      {count > 9 ? '٩+' : count}
    </span>
  )
}

function MenuItem({ icon: Icon, label, onClick, danger }: {
  icon: typeof UserRound; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition hover:bg-surface-2',
        danger ? 'text-rose-500' : 'text-ink',
      )}
    >
      <Icon size={17} /> {label}
    </button>
  )
}
