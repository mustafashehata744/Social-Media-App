import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Eye, MessageCircle, Plus, Send, Star, Trash2, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ImagePicker from '@/components/ui/ImagePicker'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useDataVersion } from '@/hooks/useDataVersion'
import { relativeTime } from '@/lib/storage'
import { cn, safeImageUrl } from '@/lib/utils'
import { getFriendIds, getUser } from '@/services/users.service'
import { createStory, deleteStory, listStories, replyToStory, toggleStoryHighlight, viewStory } from '@/services/stories.service'
import type { Story } from '@/types'

export default function StoriesRail() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const version = useDataVersion()
  const [stories, setStories] = useState<Story[]>([])
  const [composerOpen, setComposerOpen] = useState(false)
  const [storyText, setStoryText] = useState('')
  const [image, setImage] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string[] | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [deletingStory, setDeletingStory] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    void listStories().then(setStories)
  }, [version])

  const userId = user?.id
  const friendIds = userId ? getFriendIds(userId) : []
  const visibleStories = stories.filter((story) => story.authorId === userId || friendIds.includes(story.authorId))
  const grouped = new Map<string, Story[]>()
  visibleStories.forEach((story) => grouped.set(story.authorId, [...(grouped.get(story.authorId) ?? []), story]))
  const groups = [...grouped.entries()].map(([authorId, items]) => ({ authorId, latest: items[items.length - 1], ids: items.map((item) => item.id) }))
  const activeStory = activeGroup ? stories.find((story) => story.id === activeGroup[activeIndex]) : undefined
  const activeStoryId = activeStory?.id
  const activeAuthor = activeStory ? getUser(activeStory.authorId) : undefined
  const activeImage = safeImageUrl(activeStory?.image)

  useEffect(() => {
    if (!activeStoryId || !userId || activeStory?.authorId === userId) return
    viewStory(activeStoryId, userId)
  }, [activeStoryId, activeStory?.authorId, userId])

  async function publish(event: FormEvent) {
    event.preventDefault()
    if (!user || (!storyText.trim() && !image[0])) return
    setPublishing(true)
    try {
      await createStory(user.id, storyText, image[0])
      setStoryText('')
      setImage([])
      setComposerOpen(false)
      setStories(await listStories())
      toast(t('تم نشر قصتك، وستظل متاحة لمدة ٢٤ ساعة', 'Your story is live for 24 hours'))
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setPublishing(false)
    }
  }

  async function removeActiveStory() {
    if (!user || !activeStory || activeStory.authorId !== user.id || deletingStory) return
    setDeletingStory(true)
    try {
      await deleteStory(activeStory.id, user.id)
      const nextStories = await listStories()
      const remainingIds = (activeGroup ?? []).filter((id) =>
        id !== activeStory.id && nextStories.some((story) => story.id === id))
      setStories(nextStories)
      if (remainingIds.length === 0) {
        setActiveGroup(null)
      } else {
        setActiveGroup(remainingIds)
        setActiveIndex((index) => Math.min(index, remainingIds.length - 1))
      }
      toast(t('تم حذف القصة', 'Story deleted'))
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setDeletingStory(false)
    }
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault()
    if (!user || !activeStory || !replyText.trim() || replying) return
    setReplying(true)
    try {
      await replyToStory(activeStory.id, user.id, replyText)
      setReplyText('')
      setStories(await listStories())
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setReplying(false)
    }
  }

  async function toggleHighlight() {
    if (!user || !activeStory || activeStory.authorId !== user.id) return
    try {
      await toggleStoryHighlight(activeStory.id, user.id)
      setStories(await listStories())
      toast(t('تم تحديث المميزات', 'Highlights updated'))
    } catch (error) {
      toast((error as Error).message, 'error')
    }
  }

  function openGroup(ids: string[]) {
    setActiveGroup(ids)
    setActiveIndex(0)
  }

  useEffect(() => {
    if (!activeGroup || !activeStoryId) return
    const timer = window.setTimeout(() => {
      if (activeIndex < activeGroup.length - 1) setActiveIndex(activeIndex + 1)
      else setActiveGroup(null)
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [activeGroup, activeIndex, activeStoryId])

  useBodyScrollLock(!!activeGroup)

  useEffect(() => {
    if (!activeGroup) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveGroup(null)
      if (event.key === 'ArrowRight' && activeIndex < activeGroup.length - 1) setActiveIndex(activeIndex + 1)
      if (event.key === 'ArrowLeft' && activeIndex > 0) setActiveIndex(activeIndex - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeGroup, activeIndex])

  if (!user) return null

  return (
    <>
      <section aria-label={t('قصص الأصدقاء', 'Friends’ stories')} className="card flex gap-3 overflow-x-auto p-3 no-scrollbar">
        <button
          onClick={() => {
            const own = groups.find((group) => group.authorId === user.id)
            if (own) openGroup(own.ids)
            else setComposerOpen(true)
          }}
          className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"
        >
          <span className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-primary/60 bg-primary-soft text-primary">
            <Avatar user={user} size="md" className="border-0 ring-0" />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-primary text-white"><Plus size={14} /></span>
          </span>
          <span className="w-full truncate text-center text-[10px] font-bold text-muted">{t('قصتك', 'Your story')}</span>
        </button>

        {groups.some((group) => group.authorId === user.id) && (
          <button onClick={() => setComposerOpen(true)} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5" aria-label={t('إضافة قصة', 'Add story')}>
            <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-primary/60 bg-primary-soft text-primary"><Plus size={24} /></span>
            <span className="text-[10px] font-bold text-muted">{t('إضافة قصة', 'Add story')}</span>
          </button>
        )}

        {groups.filter((group) => group.authorId !== user.id).map((group) => {
          const author = getUser(group.authorId)
          if (!author) return null
          return (
            <button key={group.authorId} onClick={() => openGroup(group.ids)} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5">
              <span className="rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px]">
                <Avatar user={author} size="md" className="border-2 border-surface" />
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-muted">{author.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </section>

      <Modal open={composerOpen} onClose={() => setComposerOpen(false)} title={t('أضف إلى قصتك', 'Add to your story')} size="sm">
        <form onSubmit={publish} className="space-y-3">
          <textarea value={storyText} onChange={(event) => setStoryText(event.target.value)} rows={3} className="input resize-none" placeholder={t('اكتب شيئًا مع قصتك...', 'Write something for your story...')} />
          <ImagePicker value={image} onChange={setImage} max={1} label={t('أضف صورة للقصة', 'Add a story photo')} compact />
          <p className="text-[11px] text-muted">{t('تختفي القصة تلقائيًا بعد ٢٤ ساعة.', 'Stories disappear automatically after 24 hours.')}</p>
          <button type="submit" disabled={publishing || (!storyText.trim() && !image.length)} className="btn-primary w-full">
            <Send size={16} /> {publishing ? t('جارٍ النشر...', 'Publishing...') : t('نشر القصة', 'Share story')}
          </button>
        </form>
      </Modal>

      {activeStory && createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 overscroll-none p-0 sm:p-4"
          onClick={() => setActiveGroup(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t('عرض القصة', 'Story viewer')}
        >
          <div className="relative flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-gradient-to-br from-slate-800 via-violet-900 to-fuchsia-900 text-white shadow-pop sm:h-[min(94dvh,844px)] sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            {activeImage && <img src={activeImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/65" />
            <div className="relative z-10 flex gap-1 px-3 pt-3">
              {activeGroup?.map((id, index) => (
                <span key={id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/40">
                  <span
                    className={`block h-full bg-white ${index < activeIndex ? 'w-full' : index === activeIndex ? 'story-progress' : 'w-0'}`}
                  />
                </span>
              ))}
            </div>
            <header className="relative z-10 flex items-center gap-2 px-4 pb-2 pt-16">
              <Avatar user={activeAuthor} size="sm" verified={activeAuthor?.verified} />
              <span className="flex-1 text-sm font-bold">{activeAuthor?.name}</span>
              <span className="text-xs text-white/80">{relativeTime(activeStory.createdAt)}</span>
            </header>
            <button
              onClick={() => setActiveGroup(null)}
              aria-label={t('إغلاق القصة', 'Close story')}
              className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white shadow-lg hover:bg-black/75"
            >
              <X size={22} />
            </button>
            {activeStory.authorId === user.id && (
              <>
                <button
                  onClick={() => {
                    setActiveGroup(null)
                    setComposerOpen(true)
                  }}
                  aria-label={t('إضافة قصة', 'Add story')}
                  className="absolute left-[6.75rem] top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white shadow-lg hover:bg-primary"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => void toggleHighlight()}
                  aria-label={t('تمييز القصة', 'Highlight story')}
                  title={t('تمييز القصة في البروفايل', 'Highlight on profile')}
                  className={cn('absolute left-[3.75rem] top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white shadow-lg hover:bg-amber-500', activeStory.highlight && 'bg-amber-500')}
                >
                  <Star size={18} fill={activeStory.highlight ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => void removeActiveStory()}
                  disabled={deletingStory}
                  aria-label={t('حذف القصة', 'Delete story')}
                  className="absolute left-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white shadow-lg hover:bg-rose-600 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-4 text-center">
              {activeStory.content && (
                <p dir="auto" className="max-h-full max-w-full overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-black/45 p-4 text-xl font-bold leading-relaxed text-white shadow-2xl">
                  {activeStory.content}
                </p>
              )}
            </div>
            {activeStory.authorId === user.id ? (
              <p className="relative z-10 mx-3 mb-2 flex items-center gap-1.5 rounded-xl bg-black/35 px-3 py-2 text-[11px] text-white/90">
                <Eye size={14} /> {activeStory.viewedBy?.length ?? 0} {t('شاهد قصتك', 'views')}
              </p>
            ) : (
              <div className="relative z-10 mx-3 mb-2">
                {(activeStory.replies?.length ?? 0) > 0 && (
                  <div className="mb-2 max-h-24 space-y-1 overflow-y-auto rounded-xl bg-black/30 p-2">
                    {activeStory.replies!.slice(-3).map((reply) => (
                      <p key={reply.id} className="text-[11px] text-white/90"><span className="font-bold">{getUser(reply.authorId)?.name}: </span>{reply.text}</p>
                    ))}
                  </div>
                )}
                <form onSubmit={submitReply} className="flex gap-2">
                  <input
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={t('رد على القصة...', 'Reply to story...')}
                    className="min-w-0 flex-1 rounded-xl border border-white/30 bg-black/35 px-3 py-2 text-xs text-white outline-none placeholder:text-white/60"
                  />
                  <button type="submit" disabled={!replyText.trim() || replying} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 text-white disabled:opacity-40" aria-label={t('إرسال الرد', 'Send reply')}>
                    <MessageCircle size={16} />
                  </button>
                </form>
              </div>
            )}
            <footer className="relative z-10 flex justify-between p-3">
              <button onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} disabled={activeIndex === 0} className="rounded-lg bg-black/30 px-4 py-2 text-sm disabled:opacity-40">{t('السابق', 'Previous')}</button>
              <button
                onClick={() => {
                  if (activeGroup && activeIndex < activeGroup.length - 1) setActiveIndex((index) => index + 1)
                  else setActiveGroup(null)
                }}
                className="rounded-lg bg-black/30 px-4 py-2 text-sm"
              >
                {activeGroup && activeIndex < activeGroup.length - 1 ? t('التالي', 'Next') : t('إنهاء', 'Done')}
              </button>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
