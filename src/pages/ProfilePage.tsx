import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Briefcase, CalendarDays, MapPin, MessageCircle, Pencil, ShieldAlert, ShieldCheck, UserMinus, UserPlus, Users } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import PostCard from '@/components/posts/PostCard'
import Lightbox from '@/components/posts/Lightbox'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useDataVersion } from '@/hooks/useDataVersion'
import { relativeTime } from '@/lib/storage'
import { cn, coverStyle, isImageSource } from '@/lib/utils'
import { getPostsByAuthor } from '@/services/posts.service'
import { listStories } from '@/services/stories.service'
import type { Story } from '@/types'
import {
  areFriends, blockUser, canViewProfile, getFollowerIds, getFollowingIds, getFriendIds,
  getIncomingRequests, getOutgoingRequests, getUser, isBlocked, isFollowing, removeFriend,
  sendFriendRequest, toggleFollow, unblockUser,
} from '@/services/users.service'
import { getOrCreateConversation } from '@/services/messages.service'
import { getSettingsSync } from '@/services/settings.service'

type Tab = 'posts' | 'friends' | 'about'

export default function ProfilePage() {
  const { id } = useParams()
  const { user: current } = useAuth()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  useDataVersion()
  const [tab, setTab] = useState<Tab>('posts')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<Story[]>([])

  const profileId = id ?? current?.id
  useEffect(() => {
    if (!profileId) return
    listStories().then((all) => setHighlights(all.filter((s) => s.authorId === profileId && s.highlight)))
  }, [profileId])

  if (!current) return null
  const profile = getUser(id ?? current.id)
  if (!profile) {
    return <EmptyState icon={Users} title={t('المستخدم غير موجود', 'User not found')} description={t('ربما تم حذف الحساب أو أن الرابط غير صحيح', 'The account may have been deleted, or the link is incorrect')} action={<Link to="/feed" className="btn-primary">{t('العودة للرئيسية', 'Back to home')}</Link>} />
  }

  const isMe = profile.id === current.id
  const blocked = !isMe && isBlocked(current.id, profile.id)
  const canView = canViewProfile(current.id, profile.id)
  const friends = isMe ? getFriendIds(profile.id) : []
  const myPosts = canView ? getPostsByAuthor(profile.id) : []
  const friendship = !isMe && areFriends(current.id, profile.id)
  const following = !isMe && isFollowing(current.id, profile.id)
  const followersCount = getFollowerIds(profile.id).length
  const followingCount = getFollowingIds(profile.id).length
  const outgoing = getOutgoingRequests(current.id).some((request) => request.toId === profile.id)
  const incoming = getIncomingRequests(current.id).some((request) => request.fromId === profile.id)

  async function addFriend() {
    try {
      await sendFriendRequest(current!.id, profile!.id)
      toast(t('تم إرسال طلب الصداقة', 'Friend request sent'))
    } catch (error) { toast((error as Error).message, 'error') }
  }

  async function remove() {
    try {
      await removeFriend(current!.id, profile!.id)
      toast(t('تمت إزالة الصديق', 'Friend removed'))
    } catch (error) { toast((error as Error).message, 'error') }
  }

  async function toggleFollowAction() {
    try {
      const nowFollowing = await toggleFollow(current!.id, profile!.id)
      toast(nowFollowing ? t('أصبحت تتابع هذا الحساب', 'Now following') : t('تم إلغاء المتابعة', 'Unfollowed'))
    } catch (error) { toast((error as Error).message, 'error') }
  }

  async function toggleBlock() {
    try {
      if (isBlocked(current!.id, profile!.id)) {
        await unblockUser(current!.id, profile!.id)
        toast(t('تم إلغاء الحظر', 'User unblocked'))
      } else {
        await blockUser(current!.id, profile!.id)
        toast(t('تم حظر المستخدم', 'User blocked'))
      }
    } catch (error) { toast((error as Error).message, 'error') }
  }

  function openChat() {
    const conversation = getOrCreateConversation(current!.id, profile!.id)
    navigate(`/messages?c=${conversation.id}`)
  }

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className={cn('relative h-36 bg-gradient-to-l sm:h-48', !isImageSource(profile.cover) && profile.cover)} style={coverStyle(profile.cover)}>
          {isImageSource(profile.cover) && (
            <button
              type="button"
              onClick={() => setPreviewImage(profile.cover)}
              className="absolute inset-0 z-[1] cursor-zoom-in"
              aria-label={t('عرض صورة الغلاف', 'View cover photo')}
            />
          )}
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.22),transparent_45%)]" />
          {isMe && (
            <Link to="/profile/edit" className="absolute left-3 top-3 z-[3] flex items-center gap-1.5 rounded-xl bg-black/35 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-black/50">
            <Pencil size={14} /> {t('تعديل الغلاف', 'Edit cover')}
            </Link>
          )}
        </div>

        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative w-fit">
              <button
                type="button"
                onClick={() => setPreviewImage(profile.avatar)}
                className="cursor-zoom-in rounded-full"
                aria-label={t('عرض الصورة الشخصية', 'View profile photo')}
              >
                <Avatar user={profile} size="xl" verified={profile.verified} className="ring-4 ring-surface" />
              </button>
              {isMe && (
                <Link to="/profile/edit" className="absolute bottom-1 left-0 grid h-9 w-9 place-items-center rounded-full bg-primary text-white ring-2 ring-surface" aria-label={t('تعديل الصورة', 'Edit photo')}>
                  <Pencil size={15} />
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-2 sm:pb-1">
              {isMe ? (
                <Link to="/profile/edit" className="btn-secondary"><Pencil size={15} /> {t('تعديل البروفايل', 'Edit profile')}</Link>
              ) : (
                <>
                  <button onClick={toggleFollowAction} className={following ? 'btn-ghost' : 'btn-primary'}>
                    {following ? t('إلغاء المتابعة', 'Unfollow') : t('متابعة', 'Follow')}
                  </button>
                  {friendship ? (
                    <button onClick={remove} className="btn-ghost"><UserMinus size={16} /> {t('إزالة الصديق', 'Remove friend')}</button>
                  ) : outgoing ? (
                    <button disabled className="btn-ghost">{t('طلب مرسل ⏳', 'Request sent ⏳')}</button>
                  ) : incoming ? (
                    <Link to="/friends" className="btn-primary"><UserPlus size={16} /> {t('رد على الطلب', 'Respond to request')}</Link>
                  ) : (
                    <button onClick={addFriend} className="btn-secondary"><UserPlus size={16} /> {t('إضافة صديق', 'Add friend')}</button>
                  )}
                  <button onClick={openChat} className="btn-secondary"><MessageCircle size={16} /> {t('رسالة', 'Message')}</button>
                  <button onClick={toggleBlock} className="btn-ghost text-rose-500">
                    {blocked ? <><ShieldCheck size={16} /> {t('إلغاء الحظر', 'Unblock')}</> : <><ShieldAlert size={16} /> {t('حظر', 'Block')}</>}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
              {profile.name}
              {profile.verified && <span className="text-sm font-bold text-sky-500">✓ {t('موثّق', 'Verified')}</span>}
            </h1>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{profile.bio || t('لم يكتب نبذة بعد.', 'No bio yet.')}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>}
              {profile.work && <span className="flex items-center gap-1"><Briefcase size={14} /> {profile.work}</span>}
              <span className="flex items-center gap-1"><CalendarDays size={14} /> {t('انضم في', 'Joined')} {new Date(profile.joinedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2 border-t border-line pt-4 text-center">
            <div className="flex-1"><p className="text-lg font-extrabold text-ink">{myPosts.length}</p><p className="text-[11px] text-muted">{t('منشور', 'Posts')}</p></div>
            <div className="flex-1 border-x border-line"><p className="text-lg font-extrabold text-ink">{followersCount}</p><p className="text-[11px] text-muted">{t('متابع', 'Followers')}</p></div>
            <div className="flex-1 border-x border-line"><p className="text-lg font-extrabold text-ink">{followingCount}</p><p className="text-[11px] text-muted">{t('يتابع', 'Following')}</p></div>
            <div className="flex-1"><p className="text-lg font-extrabold text-ink">{myPosts.reduce((sum, post) => sum + post.likes.length, 0)}</p><p className="text-[11px] text-muted">{t('إعجاب', 'Likes')}</p></div>
          </div>
        </div>
      </section>

      <div className="card flex border-b border-line">
        {([['posts', t('المنشورات', 'Posts')], ['friends', t('الأصدقاء', 'Friends')], ['about', t('عن', 'About')]] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn('flex-1 border-b-2 px-2 py-3 text-xs font-bold transition sm:text-sm', tab === value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        !canView ? (
          <EmptyState icon={ShieldAlert} title={t('هذا الحساب خاص', 'This account is private')} description={t('أرسل طلب صداقة لعرض المنشورات', 'Send a friend request to see posts')} />
        ) : (
          <>
            {highlights.length > 0 && (
              <div className="card p-4">
                <p className="mb-3 text-sm font-extrabold text-ink">{t('القصص المميزة', 'Story highlights')}</p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {highlights.map((story) => (
                    <div key={story.id} className="w-20 shrink-0 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-primary bg-surface-2 text-lg">
                        {story.image ? <img src={story.image} alt="" className="h-full w-full object-cover" /> : '★'}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted">{story.content || t('قصة', 'Story')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {myPosts.length === 0
              ? <EmptyState icon={Users} title={t('لا توجد منشورات', 'No posts')} description={t('لم يشارك هذا المستخدم أي منشور بعد', 'This user has not shared any posts yet')} />
              : <div className="space-y-4">{myPosts.map((post) => <PostCard key={post.id} post={post} onChange={() => {}} />)}</div>}
          </>
        )
      )}

      {tab === 'friends' && (
        <div className="card grid gap-3 p-4 sm:grid-cols-2">
          {!isMe && <p className="col-span-full text-center text-sm text-muted">{t('قائمة أصدقاء هذا المستخدم غير متاحة في النسخة التجريبية', 'This user’s friend list is unavailable in the demo')}</p>}
          {isMe && friends.length === 0 && <p className="col-span-full text-center text-sm text-muted">{t('لم تضف أصدقاء بعد', 'You have not added any friends yet')}</p>}
          {isMe && friends.map((friendId) => {
            const friend = getUser(friendId)
            if (!friend) return null
            return (
              <Link key={friend.id} to={`/profile/${friend.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-primary">
                <Avatar user={friend} size="md" />
                <div><p className="text-sm font-bold text-ink">{friend.name}</p><p className="text-xs text-muted">{friend.work || t('عضو', 'Member')}</p></div>
              </Link>
            )
          })}
        </div>
      )}

      {tab === 'about' && (
        <div className="card space-y-4 p-5 text-sm">
          {(isMe || getSettingsSync(profile.id).showEmail) && <InfoRow label={t('البريد الإلكتروني', 'Email')} value={profile.email} />}
          <InfoRow label={t('المدينة', 'City')} value={profile.location || t('غير محدد', 'Not specified')} />
          <InfoRow label={t('العمل', 'Work')} value={profile.work || t('غير محدد', 'Not specified')} />
          <InfoRow label={t('تاريخ الانضمام', 'Joined')} value={relativeTime(profile.joinedAt, language)} />
          <InfoRow label={t('الحساب', 'Account')} value={isMe ? t('حسابك الشخصي', 'Your account') : t('عضو في تواصل', 'Tawasol member')} />
        </div>
      )}

      {previewImage && (
        <Lightbox
          images={[previewImage]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line pb-3 last:border-0"><span className="text-muted">{label}</span><span className="text-left font-bold text-ink">{value}</span></div>
}
