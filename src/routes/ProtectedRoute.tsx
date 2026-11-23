import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Spinner size="lg" />
          <p className="text-sm font-bold">{t('جارٍ تحميل تواصل...', 'Loading Tawasol...')}</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
