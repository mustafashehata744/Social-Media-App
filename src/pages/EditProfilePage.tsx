import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Save } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ImagePicker from '@/components/ui/ImagePicker'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { cn, coverStyle, isImageSource } from '@/lib/utils'
import avatar1 from '@/img/demo-avatar-1.jpg'
import avatar2 from '@/img/demo-avatar-2.jpg'
import avatar3 from '@/img/demo-avatar-3.jpg'
import avatar4 from '@/img/demo-avatar-4.jpg'
import avatar5 from '@/img/demo-avatar-5.jpg'
import avatar6 from '@/img/demo-avatar-6.jpg'
import avatar7 from '@/img/demo-avatar-7.jpg'
import avatar8 from '@/img/demo-avatar-8.jpg'

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8]
const covers = [
  'from-sky-500 via-blue-500 to-indigo-600',
  'from-rose-400 via-pink-500 to-fuchsia-600',
  'from-amber-400 via-orange-500 to-red-500',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-indigo-700',
]

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    location: user?.location ?? '',
    work: user?.work ?? '',
    avatar: user?.avatar ?? avatars[0],
    cover: user?.cover ?? covers[0],
  })
  const [saving, setSaving] = useState(false)

  if (!user) return null

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (form.name.trim().length < 3) return toast(t('الاسم يجب أن يكون ٣ أحرف على الأقل', 'Name must be at least 3 characters'), 'error')
    setSaving(true)
    try {
      await updateProfile({ ...form, name: form.name.trim() })
      toast(t('تم حفظ التغييرات على هذا الجهاز ✅', 'Changes saved on this device ✅'))
      navigate(`/profile/${user!.id}`)
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${user.id}`} className="icon-btn"><ArrowRight size={18} /></Link>
        <div><h1 className="text-xl font-extrabold text-ink">{t('تعديل البروفايل', 'Edit profile')}</h1><p className="text-xs text-muted">{t('عدّل معلوماتك وطريقة ظهورك', 'Update your information and how you appear')}</p></div>
      </div>

      <form onSubmit={onSubmit} className="card overflow-hidden">
        <div className={cn('relative h-32 bg-gradient-to-l sm:h-40', !isImageSource(form.cover) && form.cover)} style={coverStyle(form.cover)}>
          <div className="grid h-full place-items-center pt-8 text-xs font-bold text-white/90 drop-shadow">{t('غلاف البروفايل', 'Profile cover')}</div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="-mt-12 mb-5 flex items-end gap-3">
            <Avatar user={{ ...user, ...form }} size="xl" className="ring-4 ring-surface" />
            <span className="pb-1 text-xs text-muted">{t('الصورة الشخصية', 'Profile photo')}</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">{t('الاسم الكامل', 'Full name')}</label>
              <input id="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bio">{t('نبذة عنك', 'About you')}</label>
              <textarea id="bio" rows={3} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="input resize-none" placeholder={t('اكتب شيئًا عن نفسك...', 'Write something about yourself...')} />
            </div>
            <div>
              <label className="label" htmlFor="location">{t('المدينة', 'City')}</label>
              <input id="location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="input" placeholder={t('مثال: القاهرة', 'e.g. Cairo')} />
            </div>
            <div>
              <label className="label" htmlFor="work">{t('العمل', 'Work')}</label>
              <input id="work" value={form.work} onChange={(event) => setForm((current) => ({ ...current, work: event.target.value }))} className="input" placeholder={t('مثال: مهندس', 'e.g. Engineer')} />
            </div>
          </div>

          <div className="mt-6">
            <p className="label">{t('اختر صورة شخصية', 'Choose a profile photo')}</p>
            <div className="flex flex-wrap gap-2">
              {avatars.map((avatar, index) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, avatar }))}
                  className={cn('h-12 w-12 overflow-hidden rounded-full border-2 transition', form.avatar === avatar ? 'border-primary ring-2 ring-primary/20' : 'border-line hover:border-primary/50')}
                  aria-label={t(`اختر الصورة ${index + 1}`, `Choose photo ${index + 1}`)}
                >
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="label">{t('أو ارفع صورة شخصية من جهازك', 'Or upload a profile photo')}</p>
            <ImagePicker
              compact
              max={1}
              value={form.avatar.startsWith('data:image/') ? [form.avatar] : []}
              onChange={(urls) => setForm((current) => ({ ...current, avatar: urls[0] ?? avatars[0] }))}
              label={t('ارفع صورة شخصية من الجهاز', 'Upload a photo from your device')}
            />
          </div>

          <div className="mt-6">
            <p className="label">{t('اختر لون الغلاف', 'Choose a cover color')}</p>
            <div className="flex flex-wrap gap-2">
              {covers.map((gradient) => (
                <button
                  key={gradient}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, cover: gradient }))}
                  className={cn('relative h-10 w-20 rounded-xl bg-gradient-to-l ring-2 ring-offset-2 ring-offset-surface transition', gradient, form.cover === gradient ? 'ring-primary' : 'ring-transparent')}
                  aria-label={t('اختر لون الغلاف', 'Choose a cover color')}
                >
                  {form.cover === gradient && <Check size={16} className="mx-auto text-white" />}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <p className="label">{t('أو ارفع صورة غلاف من جهازك', 'Or upload a cover photo')}</p>
              <ImagePicker
                compact
                max={1}
                value={form.cover.startsWith('data:image/') ? [form.cover] : []}
                onChange={(urls) => setForm((current) => ({ ...current, cover: urls[0] ?? covers[0] }))}
                label={t('ارفع صورة غلاف', 'Upload a cover photo')}
              />
            </div>
          </div>

          <div className="mt-7 flex gap-2 border-t border-line pt-5">
            <Link to={`/profile/${user.id}`} className="btn-outline flex-1">{t('إلغاء', 'Cancel')}</Link>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <><Spinner size="sm" /> {t('جارٍ الحفظ...', 'Saving...')}</> : <><Save size={16} /> {t('حفظ التغييرات', 'Save changes')}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
