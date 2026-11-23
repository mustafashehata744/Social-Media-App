import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Hash } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import EmptyState from '@/components/ui/EmptyState'
import { useLanguage } from '@/context/LanguageContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { hashtagSearch } from '@/services/search.service'

export default function TagPage() {
  const { t } = useLanguage()
  useDataVersion()
  const { tag = '' } = useParams()
  const clean = tag.replace(/^#/, '').trim()
  const posts = clean ? hashtagSearch(clean) : []

  return (
    <div className="space-y-4">
      <div className="px-1">
        <Link to="/feed" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-muted transition hover:text-primary">
          <ArrowRight size={14} /> {t('العودة للخلاصة', 'Back to feed')}
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-ink sm:text-2xl">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <Hash size={18} />
          </span>
          <span dir="ltr" className="truncate">#{clean || tag}</span>
        </h1>
        <p className="mt-1 text-xs text-muted">
          {posts.length === 0
            ? t('لا توجد منشورات لهذا الوسم بعد', 'No posts for this hashtag yet')
            : t(`${posts.length} منشور`, `${posts.length} post${posts.length === 1 ? '' : 's'}`)}
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Hash}
          title={t('لا توجد منشورات بهذا الوسم', 'No posts with this hashtag')}
          description={t('جرّب وسمًا آخر أو شارك منشورًا جديدًا يحتوي عليه.', 'Try another hashtag, or share a post that includes it.')}
          action={<Link to="/feed" className="btn-primary">{t('العودة للخلاصة', 'Back to feed')}</Link>}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onChange={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
