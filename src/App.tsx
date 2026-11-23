import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { LanguageProvider } from '@/context/LanguageContext'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicRoute from '@/routes/PublicRoute'
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Spinner from '@/components/ui/Spinner'
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const FeedPage = lazy(() => import('@/pages/FeedPage'))
const SavedPage = lazy(() => import('@/pages/SavedPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const TagPage = lazy(() => import('@/pages/TagPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage'))
const FriendsPage = lazy(() => import('@/pages/FriendsPage'))
const MessagesPage = lazy(() => import('@/pages/MessagesPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <ErrorBoundary>
              <HashRouter>
                <Suspense fallback={<div className="grid min-h-screen place-items-center bg-canvas"><Spinner size="lg" /></div>}>
                  <Routes>
                    <Route element={<PublicRoute />}>
                      <Route path="/" element={<LandingPage />} />
                      <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      </Route>
                    </Route>

                    <Route element={<ProtectedRoute />}>
                      <Route element={<AppLayout />}>
                        <Route path="/feed" element={<FeedPage />} />
                        <Route path="/saved" element={<SavedPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/tag/:tag" element={<TagPage />} />
                        <Route path="/friends" element={<FriendsPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/profile/edit" element={<EditProfilePage />} />
                        <Route path="/profile/:id" element={<ProfilePage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
              </HashRouter>
            </ErrorBoundary>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
