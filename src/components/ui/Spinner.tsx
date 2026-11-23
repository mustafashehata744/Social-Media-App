import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export default function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { t } = useLanguage()
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-[3px]', lg: 'h-10 w-10 border-4' }
  return <span className={cn('inline-block animate-spin rounded-full border-primary/25 border-t-primary', sizes[size], className)} role="status" aria-label={t('جارٍ التحميل', 'Loading')} />
}
