import { useEffect, useState } from 'react'
import { BarChart3, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { votePoll } from '@/services/posts.service'
import type { Poll, Post } from '@/types'

interface Props {
  post: Post
  poll: Poll
  onChange: () => void
}

export default function PollCard({ post, poll, onChange }: Props) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!poll.closesAt) return
    const ms = new Date(poll.closesAt).getTime() - Date.now()
    if (ms <= 0) return
    const timer = window.setTimeout(() => setNow(Date.now()), ms)
    return () => window.clearTimeout(timer)
  }, [poll.closesAt])
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0)
  const hasVoted = !!user && poll.options.some((option) => option.votes.includes(user.id))
  const closed = !!poll.closesAt && new Date(poll.closesAt).getTime() < now

  async function vote(optionId: string) {
    if (!user || busy || closed) return
    setBusy(true)
    try {
      await votePoll(post.id, optionId, user.id)
      toast(t('تم تسجيل صوتك ✅', 'Your vote was counted ✅'))
      onChange()
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-4 mb-4 rounded-2xl border border-line bg-surface-2/50 p-4 sm:mx-5" aria-label={poll.question}>
      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
        <BarChart3 size={17} className="text-primary" />
        <span>{poll.question}</span>
      </div>
      <div className="space-y-2">
        {poll.options.map((option) => {
          const count = option.votes.length
          const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
          const picked = !!user && option.votes.includes(user.id)
          return (
            <button
              key={option.id}
              type="button"
              disabled={busy || closed || (!hasVoted && !poll.multiple ? false : picked)}
              onClick={() => void vote(option.id)}
              className={cn(
                'relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-start text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                picked ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink hover:border-primary/50',
                (busy || closed) && 'opacity-70',
              )}
            >
              <span className="absolute inset-y-0 end-0 bg-primary/10 transition-all" style={{ width: `${percent}%` }} aria-hidden="true" />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {picked && <Check size={14} />} {option.text}
                </span>
                <span className="shrink-0 text-[11px] text-muted">{percent}%</span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        {totalVotes} {t('صوت', 'votes')}
        {poll.multiple && ` · ${t('يمكن اختيار أكثر من إجابة', 'Multiple answers allowed')}`}
        {closed && ` · ${t('انتهى الاستطلاع', 'Poll closed')}`}
      </p>
    </section>
  )
}
