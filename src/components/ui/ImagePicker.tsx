import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Spinner from './Spinner'
import { useToast } from '@/context/ToastContext'
import { useLanguage } from '@/context/LanguageContext'
import { filesToDataUrls } from '@/lib/image'
import { cn } from '@/lib/utils'

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
  label?: string
  compact?: boolean
  className?: string
}

export default function ImagePicker({ value, onChange, max = 4, label = 'أضف صورًا', compact = false, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setLoading(true)
    try {
      const room = max - value.length
      if (room <= 0) throw new Error(t(`الحد الأقصى ${max} صور`, `Maximum ${max} photos`))
      if (files.length > room) {
        toast(t(`المتاح لك ${room} صور إضافية فقط`, `You can add only ${room} more photo(s)`), 'error')
        return
      }
      const urls = await filesToDataUrls(Array.from(files), room)
      onChange([...value, ...urls])
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    void handleFiles(event.dataTransfer.files)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {value.length > 0 && (
        <div className={cn('grid gap-1.5', compact ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4')}>
          {value.map((url, index) => (
            <div key={`${index}-${url.slice(0, 20)}`} className={cn('group relative overflow-hidden rounded-xl border border-line bg-surface-2', compact ? 'h-28' : 'aspect-square')}>
              <img src={url} alt={t(`صورة ${index + 1}`, `Photo ${index + 1}`)} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-100 transition hover:bg-rose-500 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={t('إزالة الصورة', 'Remove photo')}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-xs font-bold transition',
            compact ? 'h-28' : 'h-24',
            dragging ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface-2/60 text-muted hover:border-primary hover:text-primary',
          )}
        >
          {loading ? <><Spinner size="sm" /> {t('جارٍ تجهيز الصورة...', 'Preparing photo...')}</> : <><ImagePlus size={20} /> {label} {max > 1 && <span className="text-[10px] opacity-70">({value.length}/{max})</span>}</>}
        </button>
      )}
    </div>
  )
}
