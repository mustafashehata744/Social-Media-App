import { Navigate, Outlet } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'

export default function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner size="lg" /></div>
  if (user) return <Navigate to="/feed" replace />
  return <Outlet />
}
