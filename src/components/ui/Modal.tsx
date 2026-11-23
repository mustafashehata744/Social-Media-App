import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
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
  useBodyScrollLock(open)
  useFocusTrap(dialogRef, open)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 overscroll-none p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop-in max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-surface shadow-pop sm:rounded-3xl ${widths[size]}`}
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
    </div>,
    document.body,
  )
}
