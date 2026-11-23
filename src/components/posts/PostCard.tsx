import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, EyeOff, Flag, MessageCircle, MoreHorizontal, Pencil, Share2, Sparkles, Trash2 } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ImagePicker from '@/components/ui/ImagePicker'
import Modal from '@/components/ui/Modal'
import ReportDialog from '@/components/ui/ReportDialog'
import RichText from '@/components/ui/RichText'
import CommentList from './CommentList'
import Lightbox from './Lightbox'
import PollCard from './PollCard'
import PostAIPanel from './PostAIPanel'
import ReactionButton from './ReactionButton'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useClickOutside } from '@/hooks/useClickOutside'
import { relativeTime } from '@/lib/storage'
import { cn, safeImageUrl } from '@/lib/utils'
import { deletePost, getPost, hidePost, setReaction, sharePost, toggleBookmark, unhidePost, updatePost } from '@/services/posts.service'
import { getUser } from '@/services/users.service'
import type { Post, ReactionKind } from '@/types'

interface Props {
  post: Post
  onChange: () => void
  onRemoved?: (postId: string) => void
}

export default function PostCard({ post: initialPost, onChange, onRemoved }: Props) {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [post, setPost] = useState(initialPost)

  useEffect(() => setPost(initialPost), [initialPost])
  const author = getUser(post.authorId)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [reacting, setReacting] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editText, setEditText] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen)

  if (!user) return null

  const mine = post.authorId === user.id
  const images = (post.images?.length ? post.images : post.image ? [post.image] : [])
    .map(safeImageUrl)
    .filter((src): src is string => !!src)
  const selectedReaction: ReactionKind | null = post.reactions?.[user.id] ?? (post.likes.includes(user.id) ? 'like' : null)
  const saved = !!post.bookmarkedBy?.includes(user.id)
  const userId = user.id

  function showError(error: unknown) {
    toast((error as Error).message, 'error')
  }

  function refreshComments() {
    const updated = getPost(post.id)
    if (updated) setPost(updated)
    onChange()
  }

  async function react(reaction: ReactionKind | null) {
    if (reacting) return
    setReacting(true)
    const previous = post
    const nextReactions = { ...(post.reactions ?? Object.fromEntries(post.likes.map((id) => [id, 'like' as const]))) }
    if (reaction) nextReactions[userId] = reaction
    else delete nextReactions[userId]
    setPost((current) => ({ ...current, reactions: nextReactions, likes: Object.keys(nextReactions) }))

    try {
      const updated = await setReaction(post.id, userId, reaction)
      setPost((current) => ({ ...current, reactions: updated.reactions, likes: updated.likes }))
    } catch (error) {
      setPost(previous)
      showError(error)
    } finally {
      setReacting(false)
    }
  }

  async function toggleSave() {
    const next = !saved
    setPost((current) => ({
      ...current,
      bookmarkedBy: next ? [...(current.bookmarkedBy ?? []), userId] : (current.bookmarkedBy ?? []).filter((id) => id !== userId),
    }))
    try {
      await toggleBookmark(post.id, userId)
      toast(next ? t('تم حفظ المنشور 🔖', 'Post saved 🔖') : t('تمت إزالة المنشور من المحفوظات', 'Removed from saved posts'))
    } catch (error) {
      setPost((current) => ({
        ...current,
        bookmarkedBy: next ? (current.bookmarkedBy ?? []).filter((id) => id !== userId) : [...(current.bookmarkedBy ?? []), userId],
      }))
      showError(error)
    }
  }

  function openEdit() {
    setEditText(post.content)
    setEditImages(images)
    setEditOpen(true)
    setMenuOpen(false)
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await updatePost(post.id, userId, { content: editText, images: editImages })
      setEditOpen(false)
      toast(t('تم تعديل المنشور', 'Post updated'))
      onChange()
    } catch (error) {
      showError(error)
    } finally {
      setSaving(false)
    }
  }

  async function hide() {
    try {
      await hidePost(post.id, userId)
      toast(t('تم إخفاء المنشور من صفحتك', 'Post hidden from your feed'), 'info', {
        label: t('تراجع', 'Undo'),
        onClick: () => { void unhidePost(post.id, userId).then(onChange) },
      })
      onChange()
    } catch (error) {
      showError(error)
    }
  }

  async function remove() {
    setConfirmDelete(false)
    try {
      await deletePost(post.id, userId)
      toast(t('تم حذف المنشور', 'Post deleted'))
      if (onRemoved) onRemoved(post.id)
      else onChange()
    } catch (error) {
      showError(error)
    }
  }

  async function share() {
    const alreadyShared = post.sharedBy?.includes(userId)
    try {
      await sharePost(post.id, userId)
      onChange()
    } catch (error) {
      showError(error)
      return
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post.id}`)
      toast(alreadyShared ? t('تم نسخ رابط المنشور 🔗', 'Post link copied 🔗') : t('تم نسخ رابط المنشور ومشاركته 🔗', 'Post link copied and shared 🔗'))
    } catch {
      toast(alreadyShared ? t('شاركت هذا المنشور من قبل', 'You already shared this post') : t('تمت مشاركة المنشور', 'Post shared'))
    }
  }

  function pickReply(reply: string) {
    setCommentsOpen(true)
    setDraft(reply)
  }

  return (
    <article className="card overflow-hidden" data-post-id={post.id}>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <Link to={`/profile/${post.authorId}`}><Avatar user={author} size="md" verified={author?.verified} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${post.authorId}`} className="truncate text-sm font-extrabold text-ink hover:text-primary">{author?.name ?? t('مستخدم', 'User')}</Link>
            {post.feeling && <span className="hidden text-xs text-muted sm:inline">{t('يشعر بـ', 'is feeling')} {post.feeling}</span>}
          </div>
          <p className="text-[11px] text-muted">
            {relativeTime(post.updatedAt ?? post.createdAt, language)}
            {post.updatedAt && <> · {t('تم التعديل', 'Edited')}</>} · 🌐
          </p>
        </div>
        <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen((open) => !open)} className="icon-btn h-8 w-8" aria-label={t('خيارات المنشور', 'Post options')} aria-expanded={menuOpen}>
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 animate-pop-in rounded-xl border border-line bg-surface p-1.5 shadow-pop">
                <button onClick={() => { setMenuOpen(false); void toggleSave() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-ink hover:bg-surface-2">
                  <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? t('إزالة من المحفوظات', 'Remove saved') : t('حفظ المنشور', 'Save post')}
                </button>
                {mine ? (
                  <>
                    <button onClick={openEdit} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-ink hover:bg-surface-2">
                      <Pencil size={15} /> {t('تعديل المنشور', 'Edit post')}
                    </button>
                    <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10">
                      <Trash2 size={15} /> {t('حذف المنشور', 'Delete post')}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setMenuOpen(false); void hide() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-ink hover:bg-surface-2">
                      <EyeOff size={15} /> {t('إخفاء المنشور', 'Hide post')}
                    </button>
                    <button onClick={() => { setMenuOpen(false); setReportOpen(true) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10">
                      <Flag size={15} /> {t('إبلاغ', 'Report')}
                    </button>
                  </>
                )}
              </div>
            )}
        </div>
      </div>

      {post.content && <RichText text={post.content} className="block whitespace-pre-line px-4 pb-4 text-sm leading-loose text-ink sm:px-5" />}

      {images.length > 0 && (
        <div className={cn('grid gap-1 bg-surface-2 p-1', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {images.map((src, index) => (
            <button
              key={`${index}-${src.slice(0, 24)}`}
              onClick={() => setLightbox(index)}
              className={cn(
                'relative overflow-hidden bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                images.length === 3 && index === 0 ? 'col-span-2 aspect-[16/7]' : images.length > 1 ? 'aspect-square' : '',
              )}
              aria-label={t(`عرض الصورة ${index + 1}`, `View photo ${index + 1}`)}
            >
              <img
                src={src}
                alt={t(`صورة ${index + 1} من منشور ${author?.name ?? ''}`, `Photo ${index + 1} in ${author?.name ?? ''}'s post`)}
                loading="lazy"
                className={cn('h-full w-full object-cover transition duration-300 hover:scale-[1.02]', images.length === 1 && 'max-h-[560px]')}
                onError={(event) => { event.currentTarget.style.opacity = '0' }}
              />
            </button>
          ))}
        </div>
      )}

      {post.poll && <PollCard post={post} poll={post.poll} onChange={onChange} />}

      <div className="mx-4 flex items-center justify-between border-b border-line py-2 text-[11px] font-medium text-muted sm:mx-5">
        <span className="flex items-center gap-1">
          {post.likes.length > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[9px] text-white">♥</span>}
          {post.likes.length} {t('أعجبني', 'likes')}
        </span>
        <span>{post.comments.length} {t('تعليق', 'comments')} · {post.shares} {t('مشاركة', 'shares')}</span>
      </div>

      <div className="grid grid-cols-5 gap-1 p-1.5 sm:p-2">
        <ReactionButton selected={selectedReaction} disabled={reacting} onReact={(reaction) => void react(reaction)} />
        <ActionButton icon={MessageCircle} label={t('تعليق', 'Comment')} active={commentsOpen} onClick={() => setCommentsOpen((open) => !open)} />
        <ActionButton icon={Share2} label={t('مشاركة', 'Share')} onClick={() => void share()} />
        <ActionButton icon={Bookmark} label={t('حفظ', 'Save')} active={saved} onClick={() => void toggleSave()} />
        <ActionButton icon={Sparkles} label={t('مساعد AI', 'AI helper')} active={aiOpen} onClick={() => setAiOpen((open) => !open)} />
      </div>

      {aiOpen && <PostAIPanel post={post} onPickReply={pickReply} />}
      {commentsOpen && <CommentList post={post} user={user} draft={draft} onDraftChange={setDraft} onChange={refreshComments} />}

      {lightbox !== null && images[lightbox] && (
        <Lightbox images={images} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />
      )}

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="post" targetId={post.id} />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('حذف المنشور', 'Delete post')} size="sm">
        <p className="text-sm leading-relaxed text-muted">{t('هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن ذلك.', 'Are you sure you want to delete this post? This cannot be undone.')}</p>
        <div className="mt-5 flex gap-2">
          <button className="btn-outline flex-1" onClick={() => setConfirmDelete(false)}>{t('إلغاء', 'Cancel')}</button>
          <button className="btn-danger flex-1" onClick={() => void remove()}>{t('حذف', 'Delete')}</button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('تعديل المنشور', 'Edit post')} size="md">
        <form onSubmit={saveEdit} className="space-y-3">
          <textarea
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            rows={5}
            className="input resize-none leading-relaxed"
            placeholder={t('اكتب شيئًا...', 'Write something...')}
          />
          <ImagePicker value={editImages} onChange={setEditImages} max={4} label={t('أضف صورًا', 'Add photos')} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-outline flex-1">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" disabled={saving || (!editText.trim() && !editImages.length)} className="btn-primary flex-1">
              {saving ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ التعديلات', 'Save changes')}
            </button>
          </div>
        </form>
      </Modal>
    </article>
  )
}

interface ActionButtonProps {
  icon: typeof Share2
  label: string
  active?: boolean
  onClick: () => void
}

function ActionButton({ icon: Icon, label, active, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-xs font-bold transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:px-2',
        active ? 'text-primary' : 'text-muted',
      )}
    >
      <Icon size={18} fill={active && Icon === Bookmark ? 'currentColor' : 'none'} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
