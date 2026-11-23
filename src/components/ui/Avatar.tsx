import { BadgeCheck } from 'lucide-react'
import { cn, gradientFor, initials, safeImageUrl } from '@/lib/utils'
import type { User } from '@/types'

const sizes = { xs: 'h-7 w-7 text-xs', sm: 'h-9 w-9 text-sm', md: 'h-11 w-11 text-base', lg: 'h-14 w-14 text-xl', xl: 'h-28 w-28 text-5xl' }

interface Props {
  user?: Pick<User, 'id' | 'name' | 'avatar'> | null
  size?: keyof typeof sizes
  online?: boolean
  verified?: boolean
  className?: string
  onClick?: () => void
}

export default function Avatar({ user, size = 'md', online = false, verified = false, className, onClick }: Props) {
  const avatar = safeImageUrl(user?.avatar)
  const content = user ? (
    avatar
      ? <img src={avatar} alt={user.name} className="h-full w-full rounded-full object-cover" loading="lazy" />
      : <span dir="ltr" className="leading-none">{user.avatar || initials(user.name)}</span>
  ) : (
    <span className="text-muted">؟</span>
  )

  return (
    <span className={cn('relative inline-block shrink-0', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <span className={cn(
        'grid place-items-center rounded-full bg-gradient-to-br font-bold text-white shadow-inner ring-2 ring-surface',
        gradientFor(user?.id ?? 'guest'), sizes[size],
      )} title={user?.name}>
        {content}
      </span>
      {online && (
        <span
          role="status"
          title="متصل الآن"
          className="absolute bottom-0 start-0 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500"
        />
      )}
      {verified && (
        <span title="حساب موثّق" className="absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full bg-surface text-sky-500 shadow">
          <BadgeCheck size={16} aria-label="حساب موثّق" />
        </span>
      )}
    </span>
  )
}
