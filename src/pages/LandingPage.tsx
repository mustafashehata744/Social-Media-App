import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, Heart, MessageCircle, MessagesSquare, Share2, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingPage() {
  const { t } = useLanguage()
  const features = [
    { icon: Users, title: t('أصدقاء بلا حدود', 'Friends without limits'), text: t('أضف أصدقاءك، تابع أخبارهم، وشاركهم لحظاتك اليومية بسهولة.', 'Add friends, keep up with their updates, and share everyday moments.') },
    { icon: Sparkles, title: t('مساعد ذكي معك', 'Your AI assistant'), text: t('اكتب منشورًا أو حسّن صياغته أو ترجمه بمساعدة ذكية مدمجة.', 'Write, improve, or translate posts with built-in AI assistance.') },
    { icon: MessagesSquare, title: t('محادثات فورية', 'Instant messaging'), text: t('رسائل سريعة ومرتبة مع إشعارات بتفوتك أي لحظة مهمة.', 'Quick, organized messages with notifications for what matters.') },
    { icon: ShieldCheck, title: t('خصوصيتك أولًا', 'Privacy first'), text: t('تحكم كامل في إعدادات حسابك ومن يرى منشوراتك.', 'Control your account settings and who can see your posts.') },
  ]

  // Plain <a href="#..."> anchors would rewrite the URL hash and break HashRouter,
  // so in-page navigation scrolls to the section instead.
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Logo />
          <nav className="mr-auto hidden items-center gap-6 text-sm font-bold text-muted md:flex">
            <button type="button" onClick={() => scrollToSection('features')} className="hover:text-primary">{t('المزايا', 'Features')}</button>
            <button type="button" onClick={() => scrollToSection('demo')} className="hover:text-primary">{t('جرّب الآن', 'Try it')}</button>
          </nav>
          <ThemeToggle className="hidden sm:grid" />
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">{t('تسجيل الدخول', 'Sign in')}</Link>
          <Link to="/register" className="btn-primary">{t('انضم إلينا', 'Join us')}</Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-extrabold text-primary">
                <Sparkles size={14} /> {t('منصة اجتماعية عربية بالكامل', 'A social platform for everyone')}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.25] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {t('كل لحظة تستحق', 'Every moment')}<br />
                <span className="bg-gradient-to-l from-primary to-violet-600 bg-clip-text text-transparent">{t('أن تُشارَك', 'is worth sharing')}</span> ❤️
              </h1>
              <p className="mt-5 max-w-lg text-base leading-loose text-muted sm:text-lg">
                {t('تواصل هو المكان اللي يجمعك بأصدقائك وأحبائك. شارك أفكارك، اكتشف أخبارهم، واستمتع بتجربة عربية مصمّمة لك، على أي جهاز.', 'Tawasol brings you closer to friends and family. Share ideas, catch up, and enjoy a welcoming social experience on any device.')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary px-6 py-3 text-base">
                  {t('جرب الآن ', 'Get started for free')} <ArrowLeft size={18} />
                </Link>
                <Link to="/login" className="btn-outline px-6 py-3 text-base">{t('لديك حساب بالفعل؟', 'I already have an account')}</Link>
              </div>

              <div id="demo" className="mt-9 max-w-md rounded-2xl border border-dashed border-primary/30 bg-surface/70 p-4">
                <p className="flex items-center gap-2 text-xs font-extrabold text-primary"><Zap size={14} /> {t('حساب تجريبي جاهز', 'Try a demo account')}</p>
                <p className="mt-2 text-sm text-muted" dir="ltr">
                  ahmed@tawasol.com&nbsp;&nbsp;•&nbsp;&nbsp;123456
                </p>
                <Link to="/login" className="mt-2 inline-block text-xs font-bold text-primary hover:underline">{t('جرّب تسجيل الدخول ←', 'Try signing in ←')}</Link>
              </div>

            </div>

            <div className="relative hidden lg:block" aria-hidden="true">
              <div className="card rotate-1 p-5 shadow-pop">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-lg font-extrabold text-white">س</span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">{t('سارة أحمد', 'Sara Ahmed')}</p>
                    <p className="text-[11px] text-muted">{t('منذ ٥ دقائق', '5 minutes ago')}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">{t('أول يوم في مشروعي الجديد! متحمسة أشارككم الرحلة 🌱', 'First day on my new project! Excited to share the journey 🌱')}</p>
                <div className="mt-3 h-36 rounded-2xl bg-gradient-to-br from-primary/25 via-violet-500/20 to-emerald-400/20" />
                <div className="mt-4 flex items-center gap-5 text-xs font-bold text-muted">
                  <span className="flex items-center gap-1.5 text-rose-500"><Heart size={16} fill="currentColor" /> ١٢٤</span>
                  <span className="flex items-center gap-1.5"><MessageCircle size={16} /> ١٨</span>
                  <span className="flex items-center gap-1.5"><Share2 size={16} /> ٥</span>
                </div>
              </div>
              <div className="card absolute -bottom-6 right-10 flex -rotate-2 items-center gap-2.5 p-3 shadow-pop">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary"><Bell size={17} /></span>
                <p className="text-xs font-bold text-ink">{t('أحمد علّق على منشورك 💬', 'Ahmed commented on your post 💬')}</p>
              </div>
            </div>

          </div>
        </section>

        <section id="features" className="border-y border-line bg-surface/50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-ink">{t('كل اللي تحبه في مكان واحد', 'Everything you love, in one place')}</h2>
              <p className="mt-2 text-muted">{t('واجهة بسيطة، سريعة، ومرتاحة لكل أفراد العائلة', 'A simple, fast experience designed for everyone')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card p-5 transition hover:-translate-y-1 hover:shadow-pop">
                  <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon size={22} /></span>
                  <h3 className="text-base font-extrabold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-ink">{t('جاهز تنضم للعائلة؟', 'Ready to join the community?')}</h2>
          <p className="mt-3 text-muted">{t('أنشئ حسابك خلال ثوانٍ وابدأ المشاركة مع أصدقائك.', 'Create an account in seconds and start sharing with friends.')}</p>
          <Link to="/register" className="btn-primary mt-7 px-8 py-3 text-base">{t('أنشئ حسابك الآن', 'Create your account')}</Link>
        </section>
      </main>

      <footer className="border-t border-line bg-surface py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-muted sm:flex-row">
          <Logo compact />
          <p>{t('تواصل ©', 'Tawasol ©')} {new Date().getFullYear()} — {t('صُنع بحب للعربية ❤️', 'Made with love ❤️')}</p>
          <p>{t('واجهة تجريبية بدون باك إند', 'Front-end demo without a backend')}</p>
        </div>
      </footer>
    </div>
  )
}
