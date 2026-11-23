import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import MobileNav from './MobileNav'
import RightSidebar from './RightSidebar'
import AIChatWidget from '@/components/ai/AIChatWidget'
import { useAuth } from '@/context/AuthContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { getSettingsSync } from '@/services/settings.service'

export default function AppLayout() {
  const { user } = useAuth()
  const version = useDataVersion()
  const userId = user?.id

  useEffect(() => {
    const selected = userId ? getSettingsSync(userId).background ?? 'default' : 'default'
    Array.from(document.body.classList)
      .filter((name) => name.startsWith('bg-'))
      .forEach((name) => document.body.classList.remove(name))
    if (selected !== 'default') document.body.classList.add(`bg-${selected}`)
  }, [userId, version])

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto flex max-w-6xl items-start gap-5 px-3 pb-28 pt-4 sm:px-5 md:pb-12">
        <main className="min-w-0 flex-1 animate-fade-in">
          <Outlet />
        </main>
        <aside className="sticky top-20 hidden w-[300px] shrink-0 lg:block">
          <RightSidebar />
        </aside>
      </div>
      <MobileNav />
      <AIChatWidget />
    </div>
  )
}
