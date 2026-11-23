import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, MessageCircle, Search, UserMinus, UserPlus, Users, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { relativeTime } from '@/lib/storage'
import { cn } from '@/lib/utils'
import {
  acceptFriendRequest, getFriends, getIncomingRequests, getOutgoingRequests,
  getUser, rejectFriendRequest, removeFriend, searchUsers, sendFriendRequest,
} from '@/services/users.service'
import { getOrCreateConversation } from '@/services/messages.service'

type Tab = 'incoming' | 'friends' | 'suggestions' | 'outgoing'

export default function FriendsPage() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  useDataVersion()
  const [tab, setTab] = useState<Tab>('incoming')
  const [query, setQuery] = useState(params.get('q') ?? '')

  if (!user) return null
  const incoming = getIncomingRequests(user.id)
  const outgoing = getOutgoingRequests(user.id)
  const friends = getFriends(user.id)
  const outgoingIds = outgoing.map((request) => request.toId)
  const incomingIds = incoming.map((request) => request.fromId)
  const suggestions = searchUsers(query, user.id).filter((person) =>
    !friends.some((friend) => friend.id === person.id) && !outgoingIds.includes(person.id) && !incomingIds.includes(person.id))

  async function act(action: () => Promise<void>, message: string) {
    try { await action(); toast(message) }
    catch (error) { toast((error as Error).message, 'error') }
  }

  function chatWith(id: string) {
    const conversation = getOrCreateConversation(user!.id, id)
    navigate(`/messages?c=${conversation.id}`)
  }

  const tabs: Array<[Tab, string, number]> = [
    ['incoming', t('طلبات واردة', 'Requests'), incoming.length],
    ['friends', t('أصدقائي', 'My friends'), friends.length],
    ['suggestions', t('اقتراحات', 'Suggestions'), suggestions.length],
    ['outgoing', t('المرسلة', 'Sent'), outgoing.length],
  ]

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t('الأصدقاء', 'Friends')}</h1>
        <p className="text-xs text-muted">{t('تابع طلباتك واكتشف أشخاصًا جددًا', 'Manage requests and discover new people')}</p>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('ابحث بالاسم أو البريد...', 'Search by name or email...')} className="input pr-10" />
        </div>
      </div>

      <div className="card flex overflow-x-auto no-scrollbar">
        {tabs.map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn('relative flex-1 whitespace-nowrap px-3 py-3 text-xs font-bold transition sm:text-sm', tab === value ? 'text-primary' : 'text-muted hover:text-ink')}
          >
            {label} <span className="mr-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px]">{count}</span>
            {tab === value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === 'incoming' && (
        <FriendList
          empty={incoming.length === 0}
          emptyTitle={t('لا توجد طلبات جديدة', 'No new requests')}
          emptyText={t('كل طلبات الصداقة ظهرت هنا', 'Friend requests will appear here')}
          items={incoming.map((request) => {
            const person = getUser(request.fromId)
            if (!person) return null
            return (
              <FriendRow key={request.id} id={person.id} name={person.name} subtitle={`${person.work || t('عضو', 'Member')} · ${relativeTime(request.createdAt, language)}`} avatar={person.avatar} verified={person.verified}
                actions={
                  <>
                    <button onClick={() => act(() => rejectFriendRequest(request.id), t('تم رفض الطلب', 'Request declined'))} className="btn-ghost !px-3"><X size={16} /> {t('رفض', 'Decline')}</button>
                    <button onClick={() => act(() => acceptFriendRequest(request.id), t('تمت إضافة الصديق 🎉', 'Friend added 🎉'))} className="btn-primary !px-3"><Check size={16} /> {t('قبول', 'Accept')}</button>
                  </>
                }
              />
            )
          })}
        />
      )}

      {tab === 'friends' && (
        <FriendList
          empty={friends.length === 0}
          emptyTitle={t('لا يوجد أصدقاء بعد', 'No friends yet')}
          emptyText={t('ابحث عن أشخاص في تبويب الاقتراحات', 'Find people in Suggestions')}
          items={friends.map((person) => (
            <FriendRow key={person.id} id={person.id} name={person.name} subtitle={person.work || t('عضو في تواصل', 'Tawasol member')} avatar={person.avatar} verified={person.verified}
              actions={
                <>
                  <button onClick={() => chatWith(person.id)} className="btn-ghost !px-3"><MessageCircle size={16} /> {t('رسالة', 'Message')}</button>
                  <button onClick={() => act(() => removeFriend(user!.id, person.id), t('تمت إزالة الصديق', 'Friend removed'))} className="btn-outline !px-3"><UserMinus size={16} /> {t('إزالة', 'Remove')}</button>
                </>
              }
            />
          ))}
        />
      )}

      {tab === 'suggestions' && (
        <FriendList
          empty={suggestions.length === 0}
          emptyTitle={t('لا توجد اقتراحات مطابقة', 'No matching suggestions')}
          emptyText={t('جرّب اسمًا آخر أو تصفّح الأصدقاء', 'Try another name or browse your friends')}
          items={suggestions.slice(0, 12).map((person) => (
            <FriendRow key={person.id} id={person.id} name={person.name} subtitle={person.work || t('عضو في تواصل', 'Tawasol member')} avatar={person.avatar} verified={person.verified}
              actions={<button onClick={() => act(() => sendFriendRequest(user!.id, person.id), t('تم إرسال طلب الصداقة', 'Friend request sent'))} className="btn-primary !px-3"><UserPlus size={16} /> {t('إضافة', 'Add')}</button>}
            />
          ))}
        />
      )}

      {tab === 'outgoing' && (
        <FriendList
          empty={outgoing.length === 0}
          emptyTitle={t('لا توجد طلبات مرسلة', 'No sent requests')}
          emptyText={t('أضف أصدقاء من تبويب الاقتراحات', 'Add friends from Suggestions')}
          items={outgoing.map((request) => {
            const person = getUser(request.toId)
            if (!person) return null
            return (
              <FriendRow key={request.id} id={person.id} name={person.name} subtitle={`${t('طلب مرسل', 'Request sent')} · ${relativeTime(request.createdAt, language)}`} avatar={person.avatar} verified={person.verified}
                actions={<button onClick={() => act(() => rejectFriendRequest(request.id), t('تم إلغاء الطلب', 'Request cancelled'))} className="btn-ghost !px-3"><X size={16} /> {t('إلغاء', 'Cancel')}</button>}
              />
            )
          })}
        />
      )}
    </div>
  )
}

function FriendList({ items, empty, emptyTitle, emptyText }: {
  items: Array<ReactNode | null>; empty: boolean; emptyTitle: string; emptyText: string
}) {
  if (empty) return <EmptyState icon={Users} title={emptyTitle} description={emptyText} />
  return <div className="grid gap-3 sm:grid-cols-2">{items}</div>
}

function FriendRow({ id, name, subtitle, avatar, verified, actions }: {
  id: string; name: string; subtitle: string; avatar: string; verified?: boolean; actions: ReactNode
}) {
  return (
    <div className="card flex flex-wrap items-center gap-3 p-3">
      <Link to={`/profile/${id}`}><Avatar user={{ id, name, avatar }} size="md" verified={verified} /></Link>
      <div className="min-w-0 flex-1">
        <Link to={`/profile/${id}`} className="block truncate text-sm font-extrabold text-ink hover:text-primary">{name}</Link>
        <p className="truncate text-[11px] text-muted">{subtitle}</p>
      </div>
      <div className="flex w-full gap-2 sm:w-auto">{actions}</div>
    </div>
  )
}
