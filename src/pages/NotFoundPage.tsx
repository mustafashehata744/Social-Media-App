import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { useLanguage } from '@/context/LanguageContext'

export default function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <EmptyState
      icon={Compass}
      title={t('٤٠٤ — الصفحة غير موجودة', '404 — Page not found')}
      description={t('يبدو إنك تايه شوية. الرابط غلط أو الصفحة اتحذفت.', 'This page may have moved or the link may be incorrect.')}
      action={<Link to="/feed" className="btn-primary">{t('العودة للرئيسية', 'Back to home')}</Link>}
    />
  )
}
