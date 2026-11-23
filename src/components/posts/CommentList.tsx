import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, EyeOff, Flag, Heart, Pencil, Send, Trash2, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import ReportDialog from '@/components/ui/ReportDialog'
import RichText from '@/components/ui/RichText'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { relativeTime } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { addComment, deleteComment, getHiddenCommentIds, hideComment, toggleCommentLike, updateComment } from '@/services/posts.service'
import { getUser } from '@/services/users.service'
import type { Post, User } from '@/types'

interface Props {
  post: Post
  user: User
  draft: string
  onDraftChange: (value: string) => void
  onChange: () => void
}

export default function CommentList({ post, user, draft, onDraftChange, onChange }: Props) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState(() => getHiddenCommentIds(user.id))
  const [reportId, setReportId] = useState<string | null>(null)

  const visible = post.comments.filter((comment) => !hiddenIds.includes(comment.id))

  function showError(error: unknown) {
    toast((error as Error).message, 'error')
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      await addComment(post.id, user.id, draft)
      onDraftChange('')
      onChange()
    } catch (error) {
      showError(error)
    } finally {
      setSending(false)
    }
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault()
    if (!editingId) return
    try {
      await updateComment(post.id, editingId, user.id, editingText)
      setEditingId(null)
      toast(t('تم تعديل التعليق', 'Comment updated'))
      onChange()
    } catch (error) {
      showError(error)
    }
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteComment(post.id, deletingId, user.id)
      setDeletingId(null)
      toast(t('تم حذف التعليق', 'Comment deleted'))
      onChange()
    } catch (error) {
      showError(error)
    }
  }

  async function hide(commentId: string) {
    try {
      await hideComment(commentId, user.id)
      setHiddenIds((current) => [...current, commentId])
      toast(t('تم إخفاء التعليق', 'Comment hidden'))
    } catch (error) {
      showError(error)
    }
  }

  async function like(commentId: string) {
    await toggleCommentLike(post.id, commentId, user.id)
    onChange()
  }

  return (
    <div className="border-t border-line bg-surface-2/40 p-4 sm:p-5">
      {post.source === 'api' && <p className="mb-3 text-[11px] text-muted">{t('التعليقات هنا محفوظة في هذا المتصفح فقط.', 'Comments here are saved in this browser only.')}</p>}
      <div className="space-y-3">
        {visible.length === 0 && <p className="text-center text-xs text-muted">{t('كن أول من يعلّق 💬', 'Be the first to comment 💬')}</p>}
        {visible.map((comment) => {
          const writer = getUser(comment.authorId)
          const liked = comment.likes.includes(user.id)
          const mine = comment.authorId === user.id
          return (
            <div key={comment.id} className="flex items-start gap-2">
              <Link to={`/profile/${comment.authorId}`}><Avatar user={writer} size="sm" /></Link>
              <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-2xl rounded-tr-sm bg-surface px-3.5 py-2.5 shadow-card">
                  <p className="text-xs font-extrabold text-ink">{writer?.name ?? t('مستخدم', 'User')}</p>
                  {editingId === comment.id ? (
                    <form onSubmit={submitEdit} className="mt-2 flex gap-1.5">
                      <input autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} className="input min-w-0 py-1.5 text-xs" aria-label={t('تعديل التعليق', 'Edit comment')} />
                      <button type="submit" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white" aria-label={t('حفظ', 'Save')}><Check size={15} /></button>
                      <button type="button" onClick={() => setEditingId(null)} className="icon-btn h-8 w-8" aria-label={t('إلغاء', 'Cancel')}><X size={15} /></button>
                    </form>
                  ) : (
                    <RichText text={comment.content} className="mt-1 block text-sm leading-relaxed text-ink" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 px-2 text-[10px] font-bold text-muted">
                  <span>
                    {relativeTime(comment.updatedAt ?? comment.createdAt, language)}
                    {comment.updatedAt && <> · {t('معدّل', 'Edited')}</>}
                  </span>
                  <button onClick={() => void like(comment.id)} className={cn('flex items-center gap-1 hover:text-rose-500', liked && 'text-rose-500')}>
                    <Heart size={11} fill={liked ? 'currentColor' : 'none'} /> {comment.likes.length}
                  </button>
                  {mine ? (
                    <>
                      <button
                        onClick={() => { setEditingId(comment.id); setEditingText(comment.content) }}
                        className="flex items-center gap-1 hover:text-primary"
                        aria-label={t('تعديل التعليق', 'Edit comment')}
                      >
                        <Pencil size={11} /> {t('تعديل', 'Edit')}
                      </button>
                      <button onClick={() => setDeletingId(comment.id)} className="flex items-center gap-1 hover:text-rose-500" aria-label={t('حذف التعليق', 'Delete comment')}>
                        <Trash2 size={11} /> {t('حذف', 'Delete')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => void hide(comment.id)} className="flex items-center gap-1 hover:text-ink" aria-label={t('إخفاء التعليق', 'Hide comment')}>
                        <EyeOff size={11} /> {t('إخفاء', 'Hide')}
                      </button>
                      <button onClick={() => setReportId(comment.id)} className="flex items-center gap-1 hover:text-rose-500" aria-label={t('إبلاغ عن التعليق', 'Report comment')}>
                        <Flag size={11} /> {t('إبلاغ', 'Report')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={submitComment} className="mt-4 flex items-center gap-2">
        <Avatar user={user} size="sm" />
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={t('اكتب تعليقًا...', 'Write a comment...')}
          className="input min-w-0 flex-1 py-2.5"
          aria-label={t('اكتب تعليقًا', 'Write a comment')}
        />
        <button type="submit" className="btn-primary h-10 w-10 !px-0" disabled={!draft.trim() || sending} aria-label={t('إرسال التعليق', 'Send comment')}>
          <Send size={17} />
        </button>
      </form>

      <ReportDialog open={!!reportId} onClose={() => setReportId(null)} targetType="comment" targetId={reportId ?? ''} />

      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title={t('حذف التعليق', 'Delete comment')} size="sm">
        <p className="text-sm leading-relaxed text-muted">{t('هل تريد حذف هذا التعليق؟', 'Are you sure you want to delete this comment?')}</p>
        <div className="mt-5 flex gap-2">
          <button className="btn-outline flex-1" onClick={() => setDeletingId(null)}>{t('إلغاء', 'Cancel')}</button>
          <button className="btn-danger flex-1" onClick={() => void confirmDelete()}>{t('حذف', 'Delete')}</button>
        </div>
      </Modal>
    </div>
  )
}
