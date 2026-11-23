import { Outlet } from 'react-router-dom'
import { Sparkles, Users, MessageCircle, Globe2 } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useLanguage } from '@/context/LanguageContext'

export default function AuthLayout() {
  const { t } = useLanguage()
  const highlights = [
    { icon: Users, text: t('أصدقاء حقيقيون ومجتمع نابض بالحياة', 'Real friends and a vibrant community') },
    { icon: MessageCircle, text: t('محادثات فورية تقرّبك من أحبائك', 'Instant chats that bring you closer') },
    { icon: Sparkles, text: t('مساعد ذكي يساعدك في الكتابة والإبداع', 'An AI assistant for writing and creativity') },
    { icon: Globe2, text: t('تجربة عربية كاملة RTL على كل أجهزتك', 'A seamless experience on every device') },
  ]

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-5 py-5">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-12 pt-4">
          <div className="w-full max-w-md animate-fade-in"><Outlet /></div>
        </main>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-sky-500 via-primary to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
            <Sparkles size={14} /> {t('مرحبًا بك في تواصل', 'Welcome to Tawasol')}
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-tight">
            {t('كل لحظة تستحق', 'Every moment')}<br />{t('أن تُشارَك ❤️', 'is worth sharing ❤️')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/85">
            {t('مكانك الجديد للتواصل مع الأصدقاء، مشاركة أفكارك، واكتشاف ما يهمك — بواجهة عربية بسيطة ومريحة.', 'Your place to connect with friends, share ideas, and discover what matters — in a simple, welcoming experience.')}
          </p>
          <div className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Icon size={19} /></span>
                <span className="text-sm font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
