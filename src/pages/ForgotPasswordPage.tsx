import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, KeyRound, Mail } from 'lucide-react'
import PasswordInput from '@/components/ui/PasswordInput'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { emailIsValid } from '@/lib/utils'
import { requestPasswordReset, resetPassword } from '@/services/auth.service'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function onRequest(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim()) {
      setError(t('من فضلك أدخل البريد الإلكتروني', 'Please enter your email'))
      return
    }
    if (!emailIsValid(email)) {
      setError(t('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address'))
      return
    }

    const result = requestPasswordReset(email)
    if (!result.local) {
      setError(t(
        'هذا الحساب تديره واجهة الخادم (API): لا يمكن إعادة تعيين كلمة المرور محليًا. يجب أن تتم إعادة التعيين على الخادم.',
        'This account is API-managed: its password cannot be reset locally. Password reset must be handled server-side.',
      ))
      return
    }
    setDemoCode(result.code)
    setStep('reset')
  }

  function onReset(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!code.trim()) {
      setError(t('من فضلك أدخل رمز إعادة التعيين', 'Please enter the reset code'))
      return
    }
    if (newPassword.length < 6) {
      setError(t('كلمة المرور يجب أن تكون ٦ أحرف على الأقل', 'Password must be at least 6 characters'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('تأكيد كلمة المرور غير مطابق', 'Passwords do not match'))
      return
    }
    try {
      resetPassword(email, code, newPassword)
      toast(t('تم تغيير كلمة المرور محليًا، سجّل الدخول بكلمة المرور الجديدة.', 'Password changed locally. Sign in with your new password.'))
      navigate('/login', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {t('إعادة تعيين كلمة المرور', 'Reset your password')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {step === 'request'
            ? t('أدخل بريدك الإلكتروني للمتابعة', 'Enter your email to continue')
            : t('أدخل الرمز وكلمة المرور الجديدة', 'Enter the code and your new password')}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2" aria-label={t('الخطوة ١ من ٢', 'Step 1 of 2')}>
        {([['request', '١', '1'], ['reset', '٢', '2']] as const).map(([value, ar, en], index) => (
          <div key={value} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-6 bg-line" />}
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${step === value ? 'bg-primary text-white dark:text-slate-950' : 'bg-surface-2 text-muted'}`}>
              {t(ar, en)}
            </span>
          </div>
        ))}
      </div>

      <div className="card p-6 sm:p-8">
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-medium leading-relaxed text-rose-500">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={onRequest} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="reset-email">{t('البريد الإلكتروني', 'Email')}</label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="reset-email" type="email" autoComplete="email" dir="ltr"
                  value={email} onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com" className="input pl-4 pr-10 text-left"
                />
              </div>
            </div>
            <p className="rounded-xl bg-surface-2 px-4 py-3 text-xs font-medium leading-relaxed text-muted">
              {t(
                'هذه تجربة محلية فقط: لا يُرسل أي بريد إلكتروني، ولا يوجد خادم حقيقي لإعادة تعيين كلمة المرور. الحسابات التي أنشأها الخادم لا يمكن إعادة تعيينها من هنا.',
                'This is a local demo only: no email is sent and there is no real backend reset. Accounts managed by the API cannot be reset here.',
              )}
            </p>
            <button type="submit" className="btn-primary w-full py-3">
              {t('متابعة', 'Continue')}
            </button>
          </form>
        ) : (
          <form onSubmit={onReset} className="space-y-4" noValidate>
            <div className="rounded-xl border border-primary/25 bg-primary-soft/50 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-extrabold text-primary">
                <KeyRound size={15} /> {t('رمز التجربة — معروض هنا، بدون إرسال بريد', 'Demo code — shown here, no email delivery')}
              </p>
              <p dir="ltr" className="mt-2 select-all text-center text-2xl font-black tracking-[0.3em] text-ink">{demoCode}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {t(
                  'لا يوجد بريد إلكتروني ولا خادم حقيقي؛ هذا الرمز تجريبي وصالح داخل هذا المتصفح لمدة ١٥ دقيقة فقط.',
                  'No email and no real backend are involved; this is a demo code valid in this browser for 15 minutes only.',
                )}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="reset-code">{t('رمز إعادة التعيين', 'Reset code')}</label>
              <input
                id="reset-code" inputMode="numeric" autoComplete="one-time-code" dir="ltr"
                value={code} onChange={(event) => setCode(event.target.value)}
                placeholder="123456" className="input text-left"
              />
            </div>

            <div>
              <label className="label" htmlFor="new-password">{t('كلمة المرور الجديدة', 'New password')}</label>
              <PasswordInput
                id="new-password" autoComplete="new-password"
                value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="label" htmlFor="confirm-password">{t('تأكيد كلمة المرور', 'Confirm password')}</label>
              <PasswordInput
                id="confirm-password" autoComplete="new-password"
                value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setStep('request'); setError('') }} className="btn-outline flex-1">
                {t('رجوع', 'Back')}
              </button>
              <button type="submit" className="btn-primary flex-1">
                {t('تغيير كلمة المرور', 'Change password')}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="mt-6 text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition hover:text-primary">
          <ArrowRight size={14} /> {t('العودة إلى تسجيل الدخول', 'Back to sign in')}
        </Link>
      </p>
    </div>
  )
}
