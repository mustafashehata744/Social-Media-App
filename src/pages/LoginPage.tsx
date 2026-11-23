import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Mail, Sparkles } from 'lucide-react'
import PasswordInput from '@/components/ui/PasswordInput'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { emailIsValid } from '@/lib/utils'
import { seedUsers } from '@/data/seed'
import { DEMO_PASSWORD } from '@/data/demo'

const demoAccounts = [
  seedUsers.find((user) => user.id === 'u1')!,
  seedUsers.find((user) => user.id === 'u2')!,
]

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim()) return setError(t('من فضلك أدخل البريد الإلكتروني', 'Please enter your email'))
    if (!emailIsValid(email)) return setError(t('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address'))
    if (!password) return setError(t('من فضلك أدخل كلمة المرور', 'Please enter your password'))

    setLoading(true)
    try {
      await login(email, password)
      toast('أهلًا بعودتك! 🎉')
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/feed', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loginWithDemo(account: (typeof demoAccounts)[number]) {
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setError('')
    setLoading(true)
    try {
      await login(account.email, DEMO_PASSWORD)
      toast('أهلًا بعودتك! 🎉')
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/feed', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-extrabold text-ink">{t('مرحبًا بعودتك 👋', 'Welcome back 👋')}</h1>
        <p className="mt-2 text-sm text-muted">{t('سجّل دخولك وتابع ما يحدث عند أصدقائك', 'Sign in to see what your friends are sharing')}</p>
      </div>

      <div className="card p-6 sm:p-8">
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-500">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="email">{t('البريد الإلكتروني', 'Email')}</label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="email" type="email" autoComplete="email" dir="ltr"
                value={email} onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com" className="input pl-4 pr-10 text-left"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-bold text-ink" htmlFor="password">{t('كلمة المرور', 'Password')}</label>
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                {t('مشكلة في كلمة المرور؟', 'Trouble signing in?')}
              </Link>
            </div>
            <PasswordInput
              id="password" autoComplete="current-password" dir="ltr"
              value={password} onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••" className="text-left"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? <><Spinner size="sm" /> {t('جارٍ تسجيل الدخول...', 'Signing in...')}</> : <>{t('تسجيل الدخول', 'Sign in')} <ArrowLeft size={17} /></>}
          </button>
        </form>

        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-muted">
            <Sparkles size={14} className="text-primary" />
            {t('أو جرّب التطبيق بحساب تجريبي', 'Or explore the app with a demo account')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => void loginWithDemo(account)}
                disabled={loading}
                className="flex items-center gap-2.5 rounded-xl border border-line p-2.5 text-right transition hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-50"
              >
                <Avatar user={account} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{account.name}</span>
                  <span className="block text-[10px] text-muted">{t('دخول تجريبي', 'Demo account')}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t('ليس لديك حساب؟', 'Don’t have an account?')} <Link to="/register" className="link">{t('أنشئ حسابًا جديدًا', 'Create an account')}</Link>
      </p>
      <p className="mt-3 text-center">
        <Link to="/" className="text-xs font-bold text-muted hover:text-primary">{t('← العودة للرئيسية', '← Back home')}</Link>
      </p>
    </div>
  )
}
