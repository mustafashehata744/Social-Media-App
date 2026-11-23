import { useState } from 'react'
import TypingDots from '@/components/ui/TypingDots'
import { useLanguage } from '@/context/LanguageContext'
import { suggestReplies, summarizeComments } from '@/services/ai'
import { truncate } from '@/lib/utils'
import type { Post } from '@/types'

interface Props {
  post: Post
  onPickReply: (reply: string) => void
}

export default function PostAIPanel({ post, onPickReply }: Props) {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState('')
  const [replies, setReplies] = useState<string[]>([])

  async function run(task: () => Promise<void>) {
    setBusy(true)
    try {
      await task()
    } finally {
      setBusy(false)
    }
  }

  const summarize = () => run(async () => setSummary(await summarizeComments(post.comments.map((item) => item.content))))
  const suggest = () => run(async () => setReplies(await suggestReplies(post.content)))

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-primary-soft/60 p-3 sm:mx-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={summarize} className="btn-secondary !px-3 !py-2 !text-xs" disabled={busy}>{t('تلخيص التعليقات', 'Summarize comments')}</button>
        <button onClick={suggest} className="btn-secondary !px-3 !py-2 !text-xs" disabled={busy}>{t('اقتراح ردود', 'Suggest replies')}</button>
        {busy && <TypingDots className="mr-auto" label={t('المساعد بيكتب...', 'Assistant is typing...')} />}
      </div>
      {summary && <p className="mt-3 whitespace-pre-line rounded-xl bg-surface p-3 text-xs leading-relaxed text-ink">{summary}</p>}
      {replies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {replies.map((reply) => (
            <button
              key={reply}
              onClick={() => onPickReply(reply)}
              className="rounded-full border border-primary/25 bg-surface px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-white"
            >
              {truncate(reply, 55)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
