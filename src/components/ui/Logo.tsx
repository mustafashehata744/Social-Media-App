import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'

export default function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { language } = useLanguage()
  const mark = language === 'ar' ? 'ت' : 'T'
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-xl font-extrabold text-white shadow-lg shadow-primary/25">
        {mark}
      </span>
      {!compact && <span className="text-2xl font-extrabold tracking-tight text-primary">{language === 'ar' ? 'تواصل' : 'Tawasol'}</span>}
    </span>
  )
}
