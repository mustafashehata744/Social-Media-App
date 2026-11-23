import { Hash, Sparkles, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { getTrendingTags } from '@/services/posts.service'
import { getFriendIds, getOutgoingRequests, searchUsers, sendFriendRequest } from '@/services/users.service'

export default function RightSidebar() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  useDataVersion()

  if (!user) return null
  const friendIds = getFriendIds(user.id)
  const outgoing = getOutgoingRequests(user.id).map((request) => request.toId)
  const suggestions = searchUsers('', user.id)
    .filter((item) => !friendIds.includes(item.id) && !outgoing.includes(item.id))
    .slice(0, 3)
  const tags = getTrendingTags(5)

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-ink">{t('أشخاص قد تعرفهم', 'People you may know')}</h2>
          <Link to="/friends" className="text-xs font-bold text-primary hover:underline">{t('عرض الكل', 'See all')}</Link>
        </div>
        <div className="space-y-3">
          {suggestions.length === 0 && <p className="text-xs text-muted">{t('لا توجد اقتراحات حاليًا', 'No suggestions right now')}</p>}
          {suggestions.map((person) => (
            <div key={person.id} className="flex items-center gap-2.5">
              <Link to={`/profile/${person.id}`}><Avatar user={person} size="sm" verified={person.verified} /></Link>
              <div className="min-w-0 flex-1">
                <Link to={`/profile/${person.id}`} className="block truncate text-xs font-bold text-ink hover:text-primary">{person.name}</Link>
                <p className="truncate text-[11px] text-muted">{person.work || t('عضو في تواصل', 'Tawasol member')}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await sendFriendRequest(user.id, person.id)
                    toast('تم إرسال طلب الصداقة', 'success')
                  } catch (error) {
                    toast((error as Error).message, 'error')
                  }
                }}
                className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary transition hover:bg-primary hover:text-white"
                aria-label={t(`إضافة ${person.name}`, `Add ${person.name}`)}
                title={t('إضافة صديق', 'Add friend')}
              >
                <UserPlus size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {tags.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">{t('وسوم رائجة', 'Trending tags')}</h2>
            <Link to="/search" className="text-xs font-bold text-primary hover:underline">{t('استكشف', 'Explore')}</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => (
              <Link key={tag} to={`/tag/${tag}`} className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-primary-soft hover:text-primary">
                <Hash size={12} className="text-primary" /> {tag}
                <span className="text-[10px] text-muted">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-primary to-sky-500 p-5 text-white shadow-lg">
        <Sparkles className="absolute -left-6 -top-6 h-24 w-24 opacity-15" />
        <div className="relative">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold">
            <Sparkles size={12} /> {t('مدعوم بالذكاء الاصطناعي', 'AI-powered')}
          </span>
          <h3 className="text-sm font-extrabold">{t('مساعد تواصل الذكي', 'Tawasol AI assistant')}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            {t('اكتب منشورًا، حسّن صياغته، ترجمه، أو اسأله أي سؤال. المساعد جاهز أسفل الشاشة 🤖', 'Draft or improve a post, translate it, or ask a question. Your assistant is available below 🤖')}
          </p>
        </div>
      </section>

      <p className="px-2 text-center text-[11px] leading-relaxed text-muted">
        {t('تواصل ©', 'Tawasol ©')} {new Date().getFullYear()} — {t('صُنع بحب للعربية ❤️', 'Made with love ❤️')}
      </p>
    </div>
  )
}
