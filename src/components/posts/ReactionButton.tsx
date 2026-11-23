import { useRef, useState } from 'react'
import { ChevronDown, ThumbsUp } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'
import type { ReactionKind } from '@/types'

interface Props {
  selected: ReactionKind | null
  disabled: boolean
  onReact: (reaction: ReactionKind | null) => void
}

export default function ReactionButton({ selected, disabled, onReact }: Props) {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, () => setMenuOpen(false), menuOpen)

  const reactions = [
    { kind: 'like' as const, label: t('أعجبني', 'Like'), emoji: '👍', color: 'text-primary' },
    { kind: 'love' as const, label: t('أحببته', 'Love'), emoji: '❤️', color: 'text-rose-500' },
    { kind: 'care' as const, label: t('ادعمه', 'Care'), emoji: '🥰', color: 'text-amber-500' },
  ]
  const current = reactions.find((item) => item.kind === selected)

  return (
    <div ref={wrapperRef} className="relative flex min-w-0">
      <button
        onClick={() => onReact(selected ? null : 'like')}
        disabled={disabled}
        className={cn('flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-xs font-bold transition hover:bg-surface-2 sm:px-2', current ? current.color : 'text-muted')}
        aria-label={current?.label ?? t('إعجاب', 'Like')}
      >
        {current ? <span className="text-base leading-none">{current.emoji}</span> : <ThumbsUp size={18} />}
        <span className="hidden truncate sm:inline">{current?.label ?? t('إعجاب', 'Like')}</span>
      </button>
      <button
        onClick={() => setMenuOpen((open) => !open)}
        className={cn('grid w-7 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-primary', menuOpen && 'bg-surface-2 text-primary')}
        aria-label={t('اختيار تفاعل', 'Choose a reaction')}
        aria-expanded={menuOpen}
      >
        <ChevronDown size={14} />
      </button>
      {menuOpen && (
        <div className="absolute bottom-full left-0 z-30 mb-2 flex gap-1 rounded-full border border-line bg-surface p-1.5 shadow-pop">
          {reactions.map(({ kind, label, emoji }) => (
            <button
              key={kind}
              onClick={() => { setMenuOpen(false); onReact(kind) }}
              className={cn('flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-bold transition hover:bg-surface-2', selected === kind && 'bg-primary-soft')}
              aria-label={label}
              title={label}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
