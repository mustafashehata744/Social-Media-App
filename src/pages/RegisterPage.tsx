import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import PasswordInput from '@/components/ui/PasswordInput'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { emailIsValid } from '@/lib/utils'

type Field = 'name' | 'username' | 'email' | 'password' | 'confirmPassword' | 'dateOfBirth' | 'gender'
type Errors = Partial<Record<Field, string>>

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '' as '' | 'male' | 'female',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: Field, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError('')
  }

  function validate(): boolean {
    const next: Errors = {}
    if (!form.name.trim()) next.name = t('الاسم الكامل مطلوب', 'Full name is required')
    if (!/^[a-z0-9_]{3,30}$/.test(form.username)) {
      next.username = t(
        'اكتب 3 أحرف على الأقل بالإنجليزية أو أرقامًا أو _ فقط',
        'Use 3–30 lowercase English letters, numbers, or underscores',
      )
    }
    if (!emailIsValid(form.email)) next.email = t('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address')
    if (!/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(form.password)) {
      next.password = t(
        'كلمة المرور ٨ أحرف على الأقل وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا',
        'Password must be 8+ characters with uppercase, lowercase, a number, and a symbol',
      )
    }
    if (form.confirmPassword !== form.password) next.confirmPassword = t('تأكيد كلمة المرور غير مطابق', 'Passwords do not match')
    if (!form.dateOfBirth) next.dateOfBirth = t('تاريخ الميلاد مطلوب', 'Date of birth is required')
    if (!form.gender) next.gender = t('اختر النوع', 'Select gender')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setServerError('')
    if (!validate()) return
    if (!form.gender) return
    setLoading(true)
    try {
      await register({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
      })
      toast('تم إنشاء حسابك بنجاح! أهلًا بك في تواصل 🎉')
      navigate('/feed', { replace: true })
    } catch (err) {
      setServerError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-extrabold text-ink">{t('أنشئ حسابك 🎈', 'Create your account 🎈')}</h1>
        <p className="mt-2 text-sm text-muted">{t('دقيقة واحدة وتبدأ رحلتك في تواصل', 'Join Tawasol in just a minute')}</p>
      </div>

      <div className="card p-6 sm:p-8">
        {serverError && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-500">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{serverError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="name">{t('الاسم الكامل', 'Full name')}</label>
            <input
              id="name" name="name" autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)}
              placeholder={t('مثال: محمد أحمد', 'e.g. Alex Morgan')} className="input"
            />
            {errors.name && <p className="field-error"><AlertCircle size={13} />{errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="username">{t('اسم المستخدم', 'Username')}</label>
            <input
              id="username"
              name="username"
              dir="ltr"
              autoComplete="username"
              value={form.username}
              onChange={(event) => update(
                'username',
                event.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-z0-9_]/g, '')
                  .slice(0, 30),
              )}
              placeholder="mustafa_2"
              className="input text-left"
              maxLength={30}
            />
            <p className="mt-1 text-xs text-muted">
              {t('إنجليزي صغير أو أرقام أو _، والمسافات تتحول إلى _.', 'Lowercase letters, numbers, and _. Spaces become _.')}
            </p>
            {errors.username && <p className="field-error"><AlertCircle size={13} />{errors.username}</p>}
          </div>

          <div>
            <label className="label" htmlFor="email">{t('البريد الإلكتروني', 'Email')}</label>
            <input
              id="email" name="email" type="email" dir="ltr" autoComplete="email" value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="you@example.com" className="input text-left"
            />
            {errors.email && <p className="field-error"><AlertCircle size={13} />{errors.email}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="dateOfBirth">{t('تاريخ الميلاد', 'Date of birth')}</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                dir="ltr"
                autoComplete="bday"
                value={form.dateOfBirth}
                onChange={(event) => update('dateOfBirth', event.target.value)}
                className="input text-left"
              />
              {errors.dateOfBirth && <p className="field-error"><AlertCircle size={13} />{errors.dateOfBirth}</p>}
            </div>
            <div>
              <label className="label" htmlFor="gender">{t('النوع', 'Gender')}</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={(event) => update('gender', event.target.value)}
                className="input"
              >
                <option value=""> {t('اختر', 'Select')}</option>
                <option value="male">{t('ذكر', 'Male')}</option>
                <option value="female">{t('أنثى', 'Female')}</option>
              </select>
              {errors.gender && <p className="field-error"><AlertCircle size={13} />{errors.gender}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="password">{t('كلمة المرور', 'Password')}</label>
              <PasswordInput
                id="password" dir="ltr" value={form.password}
                onChange={(event) => update('password', event.target.value)} placeholder="••••••••" className="text-left"
              />
              {errors.password && <p className="field-error"><AlertCircle size={13} />{errors.password}</p>}
            </div>
            <div>
              <label className="label" htmlFor="confirm">{t('تأكيد كلمة المرور', 'Confirm password')}</label>
              <PasswordInput
                id="confirm" dir="ltr" value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)} placeholder="••••••••" className="text-left"
              />
              {errors.confirmPassword && <p className="field-error"><AlertCircle size={13} />{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="rounded-xl bg-primary-soft/60 p-3 text-xs leading-relaxed text-muted">
            <p className="flex items-center gap-1.5 font-bold text-primary"><CheckCircle2 size={14} /> {t('تسجيل آمن عبر الخادم', 'Secure account registration')}</p>
            <p className="mt-1">{t('سيتم إنشاء الحساب وإرسال بياناتك إلى API بالطريقة الرسمية.', 'Your account will be created through the API using the required fields.')}</p>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? <><Spinner size="sm" /> {t('جارٍ إنشاء الحساب...', 'Creating account...')}</> : <>{t('إنشاء الحساب', 'Create account')} <UserPlus size={17} /></>}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t('لديك حساب بالفعل؟', 'Already have an account?')} <Link to="/login" className="link">{t('سجّل الدخول', 'Sign in')}</Link>
      </p>
      <p className="mt-3 text-center">
        <Link to="/" className="text-xs font-bold text-muted hover:text-primary">{t('← العودة للرئيسية', '← Back home')}</Link>
      </p>
    </div>
  )
}
