import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Hash, Search, UserRound, FileText, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { clearRecentSearches, getRecentSearches, globalSearch, saveSearch } from '@/services/search.service'

export default function CommandPalette() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const version = useDataVersion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useFocusTrap(dialogRef, open)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches())
      window.requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery('')
    }
  }, [open])

  const results = useMemo(
    () => globalSearch(query, user?.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, user?.id, version],
  )

  if (!user) return null

  function close() {
    setOpen(false)
  }

  function go(path: string) {
    close()
    navigate(path)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    saveSearch(query)
    go(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={t('بحث عام', 'Global search')}
      >
        <Search size={16} />
        <span className="hidden flex-1 text-start sm:inline">{t('ابحث في تواصل...', 'Search Tawasol...')}</span>
        <span className="flex-1 text-start sm:hidden">{t('بحث', 'Search')}</span>
        <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-bold md:inline">Ctrl K</kbd>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[95] flex items-start justify-center bg-black/55 p-4 pt-[10vh]"
          onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}
        >
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t('البحث العام', 'Global search')} className="w-full max-w-xl animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <form onSubmit={submit} className="flex items-center gap-2 border-b border-line p-3">
              <Search size={19} className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('ابحث عن شخص، منشور أو وسم...', 'Search for a person, post or hashtag...')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              <button type="button" onClick={close} aria-label={t('إغلاق', 'Close')} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"><X size={18} /></button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!query.trim() ? (
                <>
                  <p className="px-2 py-1.5 text-[11px] font-extrabold text-muted">{t('بحثات أخيرة', 'Recent searches')}</p>
                  {recent.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted">{t('ابدأ بالكتابة للبحث في كل تواصل', 'Start typing to search all of Tawasol')}</p>}
                  {recent.map((item) => (
                    <button key={item} type="button" onClick={() => setQuery(item)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-ink hover:bg-surface-2">
                      <Search size={15} className="text-muted" /> {item}
                    </button>
                  ))}
                  {recent.length > 0 && (
                    <button type="button" onClick={() => { clearRecentSearches(); setRecent([]) }} className="mt-1 px-3 py-2 text-[11px] font-bold text-rose-500 hover:underline">
                      {t('مسح السجل', 'Clear history')}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {results.users.length > 0 && (
                    <Section title={t('أشخاص', 'People')}>
                      {results.users.map((person) => (
                        <button key={person.id} type="button" onClick={() => go(`/profile/${person.id}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start hover:bg-surface-2">
                          <Avatar user={person} size="sm" verified={person.verified} />
                          <span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{person.name}</span><span className="block truncate text-[11px] text-muted">{person.email}</span></span>
                        </button>
                      ))}
                    </Section>
                  )}
                  {results.tags.length > 0 && (
                    <Section title={t('وسوم', 'Hashtags')}>
                      {results.tags.map(({ tag, count }) => (
                        <button key={tag} type="button" onClick={() => go(`/tag/${tag}`)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-ink hover:bg-surface-2">
                          <Hash size={15} className="text-primary" /> #{tag} <span className="ms-auto text-[11px] text-muted">{count}</span>
                        </button>
                      ))}
                    </Section>
                  )}
                  {results.posts.length > 0 && (
                    <Section title={t('منشورات', 'Posts')}>
                      {results.posts.map((post) => (
                        <button key={post.id} type="button" onClick={() => go(`/feed?post=${post.id}`)} className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-start hover:bg-surface-2">
                          <FileText size={15} className="mt-0.5 shrink-0 text-primary" />
                          <span className="line-clamp-2 text-xs text-ink">{post.content || t('منشور بصور', 'Photo post')}</span>
                        </button>
                      ))}
                    </Section>
                  )}
                  {results.users.length === 0 && results.tags.length === 0 && results.posts.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted">{t('لا توجد نتائج مطابقة', 'No matching results')}</p>
                  )}
                </>
              )}
            </div>
            <div className="border-t border-line px-4 py-2 text-[10px] text-muted">
              Esc {t('للإغلاق', 'to close')} · Enter {t('لعرض كل النتائج', 'to see all results')}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <p className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-extrabold text-muted"><UserRound size={12} /> {title}</p>
      {children}
    </div>
  )
}
