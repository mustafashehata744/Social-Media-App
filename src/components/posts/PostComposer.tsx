import { useEffect, useState } from 'react'
import { BarChart3, ImagePlus, Plus, Send, Smile, Sparkles, Wand2, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ImagePicker from '@/components/ui/ImagePicker'
import TypingDots from '@/components/ui/TypingDots'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { uid } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { clearDraft, getDraft, saveDraft } from '@/services/drafts.service'
import { createPost } from '@/services/posts.service'
import { generatePostIdea, improvePost, translateText } from '@/services/ai'
import type { Poll } from '@/types'

export default function PostComposer({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const draftKey = user ? `post:${user.id}` : 'post:guest'
  const [content, setContent] = useState(() => getDraft(draftKey))
  const [images, setImages] = useState<string[]>([])
  const [feeling, setFeeling] = useState('')
  const [showImages, setShowImages] = useState(false)
  const [aiMenu, setAiMenu] = useState(false)
  const [aiBusy, setAiBusy] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [pollOpen, setPollOpen] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const feelings = ['', t('سعيد 😊', 'Happy 😊'), t('متحمس 🎉', 'Excited 🎉'), t('مفكر 🤔', 'Thoughtful 🤔'), t('ممتن 🙏', 'Grateful 🙏')]

  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(draftKey, content), 450)
    return () => window.clearTimeout(timer)
  }, [content, draftKey])

  if (!user) return null

  const usableOptions = pollOptions.map((option) => option.trim()).filter(Boolean)
  const poll: Poll | undefined = pollOpen && pollQuestion.trim() && usableOptions.length >= 2
    ? {
      question: pollQuestion.trim(),
      options: usableOptions.map((text) => ({ id: uid('po'), text, votes: [] })),
    }
    : undefined

  async function runAI(kind: 'idea' | 'improve' | 'en' | 'ar') {
    setAiMenu(false)
    setAiBusy(kind)
    try {
      if (kind === 'idea') {
        setContent(await generatePostIdea())
      } else {
        if (!content.trim()) throw new Error(t('اكتب نصًا أولًا عشان أقدر أساعدك', 'Write some text first so I can help'))
        const result = kind === 'improve'
          ? await improvePost(content)
          : await translateText(content, kind === 'en' ? 'en' : 'ar')
        setContent(result)
      }
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setAiBusy('')
    }
  }

  async function publish() {
    if (!content.trim() && images.length === 0 && !poll) return
    setPublishing(true)
    try {
      await createPost(user!.id, content, images, feeling || undefined, poll)
      setContent('')
      setImages([])
      setFeeling('')
      setShowImages(false)
      setPollOpen(false)
      setPollQuestion('')
      setPollOptions(['', ''])
      clearDraft(draftKey)
      onCreated()
      toast(poll ? t('تم نشر الاستطلاع 🗳️', 'Poll published 🗳️') : images.length > 0 ? t('تم نشر منشورك بالصور 📸', 'Photo post published 📸') : t('تم نشر منشورك بنجاح 🎉', 'Post published 🎉'))
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setPublishing(false)
    }
  }

  function updateOption(index: number, value: string) {
    setPollOptions((current) => current.map((option, position) => position === index ? value : option))
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="md" verified={user.verified} />
        <div>
          <p className="text-sm font-extrabold text-ink">{t('ما الذي يدور في بالك؟', "What's on your mind?")}</p>
          <p className="text-xs text-muted">{t('شارك أصدقائك فكرة أو لحظة—بالنص أو بالصور', 'Share an idea or moment—with text or photos')}</p>
        </div>
      </div>

      <div className="relative mt-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t(`اكتب شيئًا يا ${user.name.split(' ')[0]}...`, `Write something, ${user.name.split(' ')[0]}...`)}
          rows={content.length > 120 ? 5 : 3}
          className="input resize-none leading-relaxed"
          aria-label={t('نص المنشور', 'Post text')}
        />
        {content && <span className="absolute bottom-2 start-3 text-[10px] text-muted">{t('تم حفظ المسودة تلقائيًا', 'Draft saved automatically')}</span>}
        {aiBusy && <div className="absolute bottom-3 left-3"><TypingDots label={t('المساعد بيكتب...', 'Assistant is typing...')} /></div>}
      </div>

      {showImages && (
        <div className="mt-3">
          <ImagePicker
            value={images}
            onChange={setImages}
            max={4}
            label={t('اسحب الصور هنا أو اضغط للاختيار — حتى ٤ صور', 'Drop photos here or click to choose — up to 4')}
          />
        </div>
      )}

      {pollOpen && (
        <div className="mt-3 space-y-2 rounded-2xl border border-line bg-surface-2/50 p-3">
          <input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder={t('سؤال الاستطلاع', 'Poll question')} className="input py-2 text-xs" aria-label={t('سؤال الاستطلاع', 'Poll question')} />
          {pollOptions.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={t(`الخيار ${index + 1}`, `Option ${index + 1}`)} className="input py-2 text-xs" />
              {pollOptions.length > 2 && (
                <button type="button" onClick={() => setPollOptions((current) => current.filter((_, position) => position !== index))} className="icon-btn h-9 w-9" aria-label={t('حذف الخيار', 'Remove option')}><X size={15} /></button>
              )}
            </div>
          ))}
          {pollOptions.length < 4 && (
            <button type="button" onClick={() => setPollOptions((current) => [...current, ''])} className="flex items-center gap-1 text-[11px] font-bold text-primary">
              <Plus size={13} /> {t('إضافة خيار', 'Add option')}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        <div className="relative">
          <button
            onClick={() => setAiMenu((open) => !open)}
            className={cn('btn-ghost !px-3 text-primary', aiBusy && 'opacity-50')}
            disabled={!!aiBusy}
            aria-expanded={aiMenu}
          >
            <Sparkles size={17} /> {t('مساعد الذكاء', 'AI assistant')}
          </button>
          {aiMenu && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
              <AIMenuItem icon={Wand2} label={t('اقترح فكرة منشور', 'Suggest a post idea')} onClick={() => runAI('idea')} />
              <AIMenuItem icon={Sparkles} label={t('حسّن صياغة النص', 'Improve writing')} onClick={() => runAI('improve')} />
              <AIMenuItem icon={Send} label={t('ترجم للإنجليزية', 'Translate to English')} onClick={() => runAI('en')} />
              <AIMenuItem icon={Send} label={t('ترجم للعربية', 'Translate to Arabic')} onClick={() => runAI('ar')} />
            </div>
          )}
        </div>

        <button onClick={() => setShowImages((value) => !value)} className={cn('btn-ghost !px-3', images.length > 0 && 'text-primary')} aria-pressed={showImages}>
          <ImagePlus size={17} /> {t('صور', 'Photos')} {images.length > 0 && `(${images.length})`}
        </button>

        <button onClick={() => setPollOpen((value) => !value)} className={cn('btn-ghost !px-3', pollOpen && 'text-primary')} aria-pressed={pollOpen}>
          <BarChart3 size={17} /> {t('استطلاع', 'Poll')}
        </button>

        <label className="btn-ghost !px-3 cursor-pointer">
          <Smile size={17} />
          <select value={feeling} onChange={(event) => setFeeling(event.target.value)} className="max-w-[92px] cursor-pointer bg-transparent text-xs font-bold text-ink outline-none" aria-label={t('مشاعر', 'Feeling')}>
            {feelings.map((item) => <option key={item} value={item} className="bg-surface text-ink">{item || t('مشاعر', 'Feeling')}</option>)}
          </select>
        </label>

        <button onClick={() => void publish()} disabled={publishing || (!content.trim() && images.length === 0 && !poll)} className="btn-primary mr-auto !px-4">
          {publishing ? t('جارٍ النشر...', 'Publishing...') : <>{t('انشر', 'Post')} <Send size={16} /></>}
        </button>
      </div>
    </section>
  )
}

function AIMenuItem({ icon: Icon, label, onClick }: { icon: typeof Wand2; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold text-ink transition hover:bg-primary-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      <Icon size={15} /> {label}
    </button>
  )
}
