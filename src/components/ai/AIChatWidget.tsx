import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import TypingDots from '@/components/ui/TypingDots'
import { useLanguage } from '@/context/LanguageContext'
import { chatWithBot, translateText } from '@/services/ai'
import { cn } from '@/lib/utils'

interface ChatMessage { id: number; role: 'user' | 'bot'; text: string }
let idCounter = 0

export default function AIChatWidget() {
  const { t } = useLanguage()
  const suggestions = [
    t('اكتب منشورًا من فكرة', 'Write a post from an idea'),
    t('اقترح مشروعًا أعمل عليه', 'Suggest a project for me'),
    t('كيف أترجم نص؟', 'How do I translate text?'),
  ]
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [translateMode, setTranslateMode] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: ++idCounter, role: 'bot', text: t('أهلًا! أنا مساعد تواصل الذكي 🤖 ممكن أساعدك في الكتابة والترجمة وتلخيص التعليقات. إيه اللي تحتاجه؟', 'Hi! I’m Tawasol’s AI assistant 🤖 I can help with writing, translation, and comment summaries. What do you need?') },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || typing) return
    setMessages((items) => [...items, { id: ++idCounter, role: 'user', text: clean }])
    setInput('')
    setTyping(true)
    try {
      const reply = translateMode
        ? await translateText(clean, 'en')
        : await chatWithBot(clean)
      setMessages((items) => [...items, { id: ++idCounter, role: 'bot', text: reply }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('افتح مساعد تواصل الذكي', 'Open Tawasol AI assistant')}
        className="fixed bottom-24 left-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-primary text-white shadow-xl shadow-primary/40 transition hover:scale-105 active:scale-95 md:bottom-6 md:left-6"
      >
        <Sparkles size={24} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('مساعد تواصل الذكي 🤖', 'Tawasol AI assistant 🤖')} size="md">
        <div className="flex h-[min(60vh,430px)] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-surface-2 p-3">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-start' : 'justify-end')}>
                {message.role === 'bot' && <Bot size={16} className="ml-2 mt-1 shrink-0 text-primary" />}
                <p className={cn(
                  'max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'rounded-br-sm bg-primary text-white'
                    : 'rounded-bl-sm bg-surface text-ink shadow-card',
                )}>{message.text}</p>
              </div>
            ))}
            {typing && <div className="flex justify-end"><TypingDots /></div>}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === t('كيف أترجم نص؟', 'How do I translate text?')) {
                    setTranslateMode(true)
                    setInput('')
                  } else {
                    setTranslateMode(false)
                    void send(item)
                  }
                }}
                disabled={typing}
                className="shrink-0 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-bold text-muted transition hover:border-primary hover:text-primary disabled:opacity-50">
                {item}
              </button>
            ))}
          </div>
          {translateMode && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-primary/20 bg-primary-soft/50 px-3 py-2">
              <span className="text-xs font-bold text-primary">
                {t('وضع الترجمة للإنجليزية', 'English translation mode')}
              </span>
              <button
                type="button"
                onClick={() => setTranslateMode(false)}
                className="text-xs font-bold text-muted hover:text-primary"
              >
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => { event.preventDefault(); void send(input) }}
            className="mt-2 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={translateMode
                ? t('الصق النص العربي لترجمته للإنجليزية...', 'Paste Arabic text to translate to English...')
                : t('اكتب رسالتك...', 'Write your message...')}
              className="input flex-1 py-2.5"
              disabled={typing}
            />
            <button type="submit" className="btn-primary h-11 w-11 !px-0" disabled={typing || !input.trim()} aria-label={t('إرسال', 'Send')}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </Modal>
    </>
  )
}
