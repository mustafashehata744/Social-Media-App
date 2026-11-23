import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const { t } = useLanguage()
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, open)

  useEffect(() => {
    if (!open) return
    const scrollPosition = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousAnchor = document.documentElement.style.overflowAnchor
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflowAnchor = 'none'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflowAnchor = previousAnchor
      window.scrollTo({ top: scrollPosition, behavior: 'auto' })
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop-in max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-pop sm:rounded-3xl ${widths[size]}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
            <h2 className="text-base font-extrabold text-ink">{title}</h2>
            <button onClick={onClose} className="icon-btn h-8 w-8" aria-label={t('إغلاق', 'Close')}><X size={18} /></button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
