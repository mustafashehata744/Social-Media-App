import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Globe2, Image as ImageIcon, LogOut, Moon, Palette, RefreshCw, ShieldCheck, Sun, Monitor, UserRound } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { BACKGROUNDS } from '@/lib/backgrounds'
import { cn } from '@/lib/utils'
import { resetDB } from '@/services/db'
import { requestPushPermission } from '@/services/notifications.service'
import { getSettingsSync, updateSettings } from '@/services/settings.service'
import { getBlockedIds, getMutedIds, getUser, unblockUser } from '@/services/users.service'
import { toggleMute } from '@/services/moderation.service'
import type { ThemeMode, UserSettings } from '@/types'

const englishBackgroundLabels: Record<string, string> = {
  افتراضي: 'Default',
  شفق: 'Aurora',
  غروب: 'Sunset',
  نعناع: 'Mint',
  ليل: 'Night',
}

export default function SettingsPage() {
  const { user, logout, refresh } = useAuth()
  const { language, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<UserSettings>(() => getSettingsSync(user?.id ?? ''))
  const [confirmReset, setConfirmReset] = useState(false)
  const blocked = user ? getBlockedIds(user.id).map((id) => getUser(id)).filter((person): person is NonNullable<typeof person> => !!person) : []
  const muted = user ? getMutedIds(user.id).map((id) => getUser(id)).filter((person): person is NonNullable<typeof person> => !!person) : []

  if (!user) return null

  async function patch(values: Partial<UserSettings>) {
    try {
      const updated = await updateSettings(user!.id, values)
      setSettings(updated)
      if (values.theme) setTheme(values.theme)
    } catch (error) {
      toast((error as Error).message || 'تعذّر حفظ الإعدادات', 'error')
    }
  }

  const themes: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: 'light', label: t('فاتح', 'Light'), icon: Sun },
    { value: 'dark', label: t('داكن', 'Dark'), icon: Moon },
    { value: 'system', label: t('تلقائي', 'System'), icon: Monitor },
  ]

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t('الإعدادات', 'Settings')}</h1>
        <p className="text-xs text-muted">{t('تحكم في تجربتك وخصوصيتك', 'Manage your experience and privacy')}</p>
      </div>

      <Section icon={Palette} title={t('المظهر', 'Appearance')} subtitle={t('اختر الشكل الذي يناسبك', 'Choose the look that works for you')}>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => patch({ theme: value })}
              className={cn('flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs font-bold transition', theme === value ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted hover:border-primary/40')}
            >
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface-2/50 p-3">
          <Toggle label={t('الوضع الداكن مجدول', 'Scheduled dark mode')} checked={settings.themeSchedule ?? false} onChange={(value) => patch({ themeSchedule: value })} />
          {settings.themeSchedule && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-bold text-ink">
                {t('من', 'From')}
                <input type="time" value={settings.scheduleStart ?? '22:00'} onChange={(event) => patch({ scheduleStart: event.target.value })} className="input mt-1" />
              </label>
              <label className="text-xs font-bold text-ink">
                {t('إلى', 'To')}
                <input type="time" value={settings.scheduleEnd ?? '06:00'} onChange={(event) => patch({ scheduleEnd: event.target.value })} className="input mt-1" />
              </label>
            </div>
          )}
        </div>
      </Section>

      <Section icon={ImageIcon} title={t('خلفية التطبيق', 'App background')} subtitle={t('اختر خلفية بدل الخلفية البيضاء', 'Choose an app background')}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {BACKGROUNDS.map((background) => {
            const active = (settings.background ?? 'default') === background.id
            return (
              <button
                key={background.id}
                onClick={() => patch({ background: background.id })}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-[11px] font-bold transition',
                  active ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted hover:border-primary/40',
                )}
              >
                <span className={cn('h-10 w-full rounded-lg border border-white/30 shadow-inner', background.swatch)} />
                <span className="flex items-center gap-1">
                  {active && <Check size={12} />}
                  {t(background.label, englishBackgroundLabels[background.label] ?? background.label)}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('تُحفظ الخلفية تلقائيًا وتظهر بعد تحديث الصفحة.', 'Your background is saved automatically and appears after a refresh.')}</p>
      </Section>

      <Section icon={Globe2} title={t('اللغة', 'Language')} subtitle={t('لغة الواجهة', 'Interface language')}>
        <div className="flex gap-2">
          <button onClick={() => patch({ language: 'ar' })} className={cn('flex-1', language === 'ar' ? 'btn-secondary' : 'btn-ghost')}>العربية</button>
          <button onClick={() => patch({ language: 'en' })} className={cn('flex-1', language === 'en' ? 'btn-secondary' : 'btn-ghost')}>English</button>
        </div>
      </Section>

      <Section icon={Bell} title={t('الإشعارات', 'Notifications')} subtitle={t('اختر ما يصلك من تنبيهات', 'Choose which alerts you receive')}>
        <Toggle label={t('إعجابات على منشوراتك', 'Likes on your posts')} checked={settings.notifyLikes} onChange={(value) => patch({ notifyLikes: value })} />
        <Toggle label={t('تعليقات جديدة', 'New comments')} checked={settings.notifyComments} onChange={(value) => patch({ notifyComments: value })} />
        <Toggle label={t('طلبات صداقة', 'Friend requests')} checked={settings.notifyFriends} onChange={(value) => patch({ notifyFriends: value })} />
        <Toggle label={t('رسائل جديدة', 'New messages')} checked={settings.notifyMessages} onChange={(value) => patch({ notifyMessages: value })} />
        <Toggle
          label={t('تنبيهات المتصفح (محاكاة محلية)', 'Browser notifications (local simulation)')}
          checked={settings.pushNotifications ?? false}
          onChange={async (value) => {
            if (!value) { await patch({ pushNotifications: false }); return }
            const permission = await requestPushPermission()
            if (permission === 'granted') await patch({ pushNotifications: true })
            else toast(t('لم يتم منح إذن التنبيهات', 'Notification permission was not granted'), 'error')
          }}
        />
      </Section>

      <Section icon={ShieldCheck} title={t('الخصوصية', 'Privacy')} subtitle={t('من يستطيع رؤية بياناتك', 'Control who can see your information')}>
        <Toggle label={t('حساب خاص', 'Private account')} checked={settings.privateAccount} onChange={(value) => patch({ privateAccount: value })} />
        <Toggle label={t('إظهار البريد الإلكتروني في البروفايل', 'Show email on profile')} checked={settings.showEmail} onChange={(value) => patch({ showEmail: value })} />
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <p className="text-xs font-extrabold text-ink">{t('الحسابات المحظورة', 'Blocked accounts')}</p>
          {blocked.length === 0 ? <p className="text-[11px] text-muted">{t('لا يوجد حسابات محظورة', 'No blocked accounts')}</p> : blocked.map((person) => (
            <div key={person.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-xs">
              <span className="font-bold text-ink">{person.name}</span>
              <button className="text-primary hover:underline" onClick={async () => { await unblockUser(user.id, person.id); toast(t('تم إلغاء الحظر', 'Unblocked')); }}>{t('إلغاء الحظر', 'Unblock')}</button>
            </div>
          ))}
          <p className="pt-2 text-xs font-extrabold text-ink">{t('الحسابات المكتومة', 'Muted accounts')}</p>
          {muted.length === 0 ? <p className="text-[11px] text-muted">{t('لا يوجد حسابات مكتومة', 'No muted accounts')}</p> : muted.map((person) => (
            <div key={person.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-xs">
              <span className="font-bold text-ink">{person.name}</span>
              <button className="text-primary hover:underline" onClick={async () => { await toggleMute(user.id, person.id); toast(t('تم إلغاء الكتم', 'Unmuted')); }}>{t('إلغاء الكتم', 'Unmute')}</button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={UserRound} title={t('الحساب', 'Account')} subtitle={`${t('مسجّل الدخول كـ', 'Signed in as')} ${user.email}`}>
        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={() => { logout(); navigate('/login'); toast(t('تم تسجيل الخروج', 'Signed out')) }} className="btn-danger">
            <LogOut size={16} /> {t('تسجيل الخروج', 'Sign out')}
          </button>
          <button onClick={() => setConfirmReset(true)} className="btn-outline">
            <RefreshCw size={16} /> {t('إعادة البيانات التجريبية', 'Reset demo data')}
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('إعادة البيانات ستمسح أي منشورات أو رسائل أضفتها في هذه النسخة التجريبية.', 'Resetting will remove posts and messages you added in this demo.')}</p>
      </Section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title={t('إعادة البيانات التجريبية', 'Reset demo data')} size="sm">
        <p className="text-sm leading-relaxed text-muted">{t('سيتم حذف كل تغييراتك والعودة للبيانات الأصلية. هل تريد المتابعة؟', 'Your changes will be removed and the original demo data restored. Continue?')}</p>
        <div className="mt-5 flex gap-2">
          <button className="btn-outline flex-1" onClick={() => setConfirmReset(false)}>{t('إلغاء', 'Cancel')}</button>
          <button className="btn-danger flex-1" onClick={() => {
            resetDB()
            setConfirmReset(false)
            refresh()
            toast(t('تمت إعادة البيانات التجريبية ✅', 'Demo data restored ✅'))
            navigate('/feed')
          }}>{t('إعادة', 'Reset')}</button>
        </div>
      </Modal>
    </div>
  )
}

function Section({ icon: Icon, title, subtitle, children }: {
  icon: typeof Bell; title: string; subtitle: string; children: ReactNode
}) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><Icon size={19} /></span>
        <div><h2 className="text-sm font-extrabold text-ink">{title}</h2><p className="text-[11px] text-muted">{subtitle}</p></div>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-1 py-2.5">
      <span className="text-sm text-ink">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-primary' : 'bg-muted/40')}
      >
        <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-1' : 'right-1')} />
      </button>
    </div>
  )
}
