import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { getBookmarkedPosts } from '@/services/posts.service'

export default function SavedPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  useDataVersion()

  if (!user) return null

  const posts = getBookmarkedPosts(user.id)

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t('المنشورات المحفوظة', 'Saved posts')}</h1>
        <p className="text-xs text-muted">
          {posts.length === 0
            ? t('احفظ المنشورات لتعود إليها لاحقًا', 'Save posts to come back to them later')
            : t(`لديك ${posts.length} منشور محفوظ`, `You have ${posts.length} saved post${posts.length === 1 ? '' : 's'}`)}
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t('لا توجد منشورات محفوظة', 'No saved posts')}
          description={t('اضغط على زر الحفظ في أي منشور ليظهر هنا.', 'Tap the save button on any post and it will appear here.')}
          action={<Link to="/feed" className="btn-primary">{t('تصفح الخلاصة', 'Browse feed')}</Link>}
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
