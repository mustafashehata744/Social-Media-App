import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  images: string[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export default function Lightbox({ images, index, onIndexChange, onClose }: Props) {
  const { t } = useLanguage()
  const dialogRef = useRef<HTMLDivElement>(null)
  const total = images.length
  useFocusTrap(dialogRef, true)

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onIndexChange((index + 1) % total)
      if (event.key === 'ArrowRight') onIndexChange((index - 1 + total) % total)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [index, total, onClose, onIndexChange])

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('عرض الصور', 'View photos')}
    >
      <button onClick={onClose} className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label={t('إغلاق', 'Close')}>
        <X size={22} />
      </button>
      {total > 1 && (
        <button
          onClick={(event) => { event.stopPropagation(); onIndexChange((index - 1 + total) % total) }}
          className="absolute right-3 top-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-6"
          aria-label={t('الصورة السابقة', 'Previous photo')}
        >
          <ChevronRight size={24} />
        </button>
      )}
      <img
        src={images[index]}
        alt={t(`الصورة ${index + 1}`, `Photo ${index + 1}`)}
        className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
      {total > 1 && (
        <button
          onClick={(event) => { event.stopPropagation(); onIndexChange((index + 1) % total) }}
          className="absolute left-3 top-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-6"
          aria-label={t('الصورة التالية', 'Next photo')}
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {total > 1 && <span className="absolute bottom-5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white">{index + 1} / {total}</span>}
    </div>,
    document.body,
  )
}
