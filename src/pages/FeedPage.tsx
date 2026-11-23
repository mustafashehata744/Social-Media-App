import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bookmark, Newspaper } from 'lucide-react'
import PostComposer from '@/components/posts/PostComposer'
import PostCard from '@/components/posts/PostCard'
import StoriesRail from '@/components/stories/StoriesRail'
import EmptyState from '@/components/ui/EmptyState'
import { PostSkeleton } from '@/components/ui/Skeletons'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { findPostById, listPostsPage } from '@/services/posts.service'
import { getFriendIds } from '@/services/users.service'
import { cn } from '@/lib/utils'
import type { Post } from '@/types'

function mergePosts(current: Post[], incoming: Post[], replace = false): Post[] {
  const byId = new Map<string, Post>()
  if (!replace) current.forEach((post) => byId.set(post.id, post))
  incoming.forEach((post) => byId.set(post.id, post))
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export default function FeedPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const version = useDataVersion()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextPage, setNextPage] = useState<number | null>(1)
  const [filter, setFilter] = useState<'all' | 'friends'>('all')
  const [params] = useSearchParams()
  const sharedPostId = params.get('post')
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const postsRef = useRef<Post[]>([])
  const versionRef = useRef(0)
  const deepLinkRef = useRef({ id: '', loading: false, highlighted: false })

  const userId = user?.id
  const friendIds = useMemo(() => (userId ? getFriendIds(userId) : []), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, version])

  useEffect(() => { postsRef.current = posts }, [posts])

  const loadPage = useCallback(async (page: number, replace = false) => {
    if (!userId) return
    if (page === 1) {
      if (loadingRef.current) return
      loadingRef.current = true
      if (replace) setLoading(true)
    } else {
      if (loadingMoreRef.current) return
      loadingMoreRef.current = true
      setLoadingMore(true)
    }

    try {
      const result = await listPostsPage(userId, page, 10)
      setPosts((current) => mergePosts(current, result.posts, replace))
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch {
      // Keep the already loaded posts visible; the old feed is better than an empty screen.
    } finally {
      if (page === 1) {
        loadingRef.current = false
        setLoading(false)
      } else {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }, [userId])

  useEffect(() => { void loadPage(1, true) }, [loadPage])

  // Local writes emit tawasol:changed. Merge page 1 instead of resetting the whole feed.
  useEffect(() => {
    if (version === versionRef.current) return
    versionRef.current = version
    if (version > 0) void loadPage(1, false)
  }, [version, loadPage])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || loading || loadingMore || !hasMore || nextPage === null) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadPage(nextPage, false)
    }, { rootMargin: '300px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, nextPage, loadPage, posts.length])

  // The Friends filter must search all loaded pages, not only the current page.
  const friendPostCount = posts.filter((post) => friendIds.includes(post.authorId)).length
  useEffect(() => {
    if (filter !== 'friends' || loading || loadingMore || !hasMore || nextPage === null) return
    if (friendPostCount < 5) void loadPage(nextPage, false)
  }, [filter, friendPostCount, hasMore, loading, loadingMore, nextPage, loadPage])

  // Shared links can point at a post outside the first page.
  useEffect(() => {
    if (!sharedPostId || loading) return
    if (deepLinkRef.current.id !== sharedPostId) {
      deepLinkRef.current = { id: sharedPostId, loading: false, highlighted: false }
    }
    const found = postsRef.current.some((post) => post.id === sharedPostId)
    if (!found && !deepLinkRef.current.loading) {
      deepLinkRef.current.loading = true
      void findPostById(sharedPostId)
        .then((post) => { if (post) setPosts((current) => mergePosts(current, [post])) })
        .finally(() => { deepLinkRef.current.loading = false })
      return
    }
    if (!found || deepLinkRef.current.highlighted) return
    deepLinkRef.current.highlighted = true
    const element = Array.from(document.querySelectorAll<HTMLElement>('[data-post-id]'))
      .find((node) => node.getAttribute('data-post-id') === sharedPostId)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('ring-2', 'ring-primary')
    const timer = window.setTimeout(() => element.classList.remove('ring-2', 'ring-primary'), 2500)
    return () => window.clearTimeout(timer)
  }, [sharedPostId, loading, posts])

  if (!user) return null
  const visible = filter === 'friends' ? posts.filter((post) => friendIds.includes(post.authorId)) : posts

  return (
    <div className="space-y-4" style={{ overflowAnchor: 'none' }}>
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t('الرئيسية', 'Home')}</h1>
          <p className="text-xs text-muted">{t('أحدث ما يشاركه أصدقاؤك', 'The latest updates from your friends')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/saved" className="icon-btn h-9 w-9" aria-label={t('المنشورات المحفوظة', 'Saved posts')} title={t('المحفوظات', 'Saved')}>
            <Bookmark size={17} />
          </Link>
          <div className="flex rounded-xl bg-surface p-1">
            {([['all', t('الكل', 'All')], ['friends', t('الأصدقاء', 'Friends')]] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary', filter === value ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StoriesRail />
      <PostComposer onCreated={() => {
        void loadPage(1, false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }} />

      {loading ? (
        <div className="space-y-4"><PostSkeleton /><PostSkeleton /></div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={filter === 'friends' ? t('لا توجد منشورات من الأصدقاء', 'No posts from friends yet') : t('لا توجد منشورات بعد', 'No posts yet')}
          description={filter === 'friends' ? t('جرّب عرض الكل أو أضف أصدقاء جددًا', 'Switch to All or add some friends') : t('كن أول من يشارك شيئًا مع المجتمع', 'Be the first to share something with the community')}
          action={filter === 'friends' ? <button className="btn-secondary" onClick={() => setFilter('all')}>{t('عرض الكل', 'Show all')}</button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onChange={() => void loadPage(1, false)}
              onRemoved={(postId) => {
                const scrollPosition = window.scrollY
                setPosts((current) => current.filter((item) => item.id !== postId))
                window.requestAnimationFrame(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }))
              }}
            />
          ))}
          <div ref={loadMoreRef} className="h-1" />
          {loadingMore && <PostSkeleton />}
          {!hasMore && visible.length > 3 && (
            <p className="py-4 text-center text-xs text-muted">{t('وصلت لنهاية المنشورات', 'You’re all caught up')}</p>
          )}
        </div>
      )}
    </div>
  )
}
