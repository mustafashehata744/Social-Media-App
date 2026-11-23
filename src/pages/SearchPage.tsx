import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock3, FileText, Hash, Search, Users, X, type LucideIcon } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { truncate } from '@/lib/utils'
import {
  clearRecentSearches, getRecentSearches, globalSearch, saveSearch, type SearchResults,
} from '@/services/search.service'
import { getUser } from '@/services/users.service'

const EMPTY_RESULTS: SearchResults = { users: [], posts: [], tags: [] }

export default function SearchPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const version = useDataVersion()
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const [input, setInput] = useState(query)
  const userId = user?.id

  useEffect(() => setInput(query), [query])

  const results = useMemo(
    () => (userId ? globalSearch(query, userId) : EMPTY_RESULTS),
    // version triggers refresh when local data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, userId, version],
  )
  const recent = useMemo(() => getRecentSearches(), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version])
  const trending = useMemo(() => (query ? [] : globalSearch('', userId).tags), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, userId, version])

  if (!user) return null

  function runSearch(term: string) {
    const next = term.trim()
    if (!next) {
      setParams({})
      return
    }
    saveSearch(next)
    setParams({ q: next })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    runSearch(input)
  }

  const total = results.users.length + results.posts.length + results.tags.length

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t('البحث', 'Search')}</h1>
        <p className="text-xs text-muted">{t('ابحث عن أشخاص ومنشورات ووسوم داخل تواصل', 'Search people, posts, and hashtags across Tawasol')}</p>
      </div>

      <form onSubmit={onSubmit} className="card p-4" role="search">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search" value={input} onChange={(event) => setInput(event.target.value)}
            placeholder={t('ابحث هنا...', 'Search here...')}
            aria-label={t('كلمة البحث', 'Search query')}
            className="input pr-10"
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted">{t('البحث يتم محليًا داخل بياناتك', 'Search runs locally over your data')}</p>
          <button type="submit" className="btn-primary !px-4 !py-2 !text-xs">
            <Search size={15} /> {t('بحث', 'Search')}
          </button>
        </div>
      </form>

      {recent.length > 0 && (
        <section className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <Clock3 size={16} className="text-primary" /> {t('عمليات البحث الأخيرة', 'Recent searches')}
            </h2>
            <button
              type="button"
              onClick={() => {
                clearRecentSearches()
                toast(t('تم مسح عمليات البحث الأخيرة', 'Recent searches cleared'), 'info')
              }}
              className="btn-ghost !px-2 !py-1 !text-[11px]"
            >
              <X size={14} /> {t('مسح', 'Clear')}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((item) => (
              <button
                key={item} type="button"
                onClick={() => { setInput(item); runSearch(item) }}
                className="max-w-full truncate rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-primary-soft hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      )}

      {!query && trending.length > 0 && (
        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Hash size={16} className="text-primary" /> {t('وسوم رائجة', 'Trending tags')}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {trending.map((item) => (
              <Link
                key={item.tag} to={`/tag/${encodeURIComponent(item.tag)}`}
                className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary transition hover:brightness-95"
              >
                #{item.tag} <span className="opacity-70">({item.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!query ? (
        <EmptyState
          icon={Search}
          title={t('ماذا تبحث عنه اليوم؟', 'What are you looking for?')}
          description={t('ابحث عن اسم شخص أو كلمة في منشور أو وسم لتظهر لك النتائج هنا.', 'Search for a person, a word in a post, or a hashtag to see results here.')}
        />
      ) : total === 0 ? (
        <EmptyState
          icon={Search}
          title={t('لا توجد نتائج', 'No results')}
          description={t(`لم نجد نتائج لـ «${query}»، جرّب كلمة أخرى.`, `We couldn’t find anything for “${query}”. Try another search.`)}
        />
      ) : (
        <>
          {results.users.length > 0 && (
            <section className="card overflow-hidden">
              <SectionTitle icon={Users} label={t('الأشخاص', 'People')} count={results.users.length} />
              {results.users.map((person) => (
                <Link key={person.id} to={`/profile/${person.id}`} className="flex items-center gap-3 border-t border-line p-3 transition hover:bg-surface-2 sm:p-4">
                  <Avatar user={person} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">{person.name}</p>
                    <p className="truncate text-[11px] text-muted">{person.bio || person.work || t('عضو في تواصل', 'Tawasol member')}</p>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.posts.length > 0 && (
            <section className="card overflow-hidden">
              <SectionTitle icon={FileText} label={t('المنشورات', 'Posts')} count={results.posts.length} />
              {results.posts.map((post) => {
                const author = getUser(post.authorId)
                return (
                  <Link key={post.id} to={`/feed?post=${encodeURIComponent(post.id)}`} className="flex items-center gap-3 border-t border-line p-3 transition hover:bg-surface-2 sm:p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><FileText size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-ink">{author?.name ?? t('مستخدم', 'User')}</p>
                      <p className="truncate text-[11px] text-muted">{post.content ? truncate(post.content, 120) : t('منشور بلا نص', 'Post without text')}</p>
                    </div>
                  </Link>
                )
              })}
            </section>
          )}

          {results.tags.length > 0 && (
            <section className="card overflow-hidden">
              <SectionTitle icon={Hash} label={t('الوسوم', 'Hashtags')} count={results.tags.length} />
              {results.tags.map((item) => (
                <Link key={item.tag} to={`/tag/${encodeURIComponent(item.tag)}`} className="flex items-center gap-3 border-t border-line p-3 transition hover:bg-surface-2 sm:p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Hash size={18} /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-ink">#{item.tag}</span>
                  <span className="shrink-0 text-[11px] text-muted">{item.count} {t('منشور', 'posts')}</span>
                </Link>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, label, count }: { icon: LucideIcon; label: string; count: number }) {
  return (
    <h2 className="flex items-center gap-2 px-3 py-3 text-sm font-extrabold text-ink sm:px-4">
      <Icon size={16} className="text-primary" /> {label}
      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">{count}</span>
    </h2>
  )
}
