import { pick } from '@/lib/lang'
import { delay, read, uid, write, writeSilently } from '@/lib/storage'
import { KEYS, ensureDB } from './db'
import { pushNotification } from './notifications.service'
import type { Comment, Poll, Post, ReactionKind, Report, User } from '@/types'
import { apiRequest, apiRequestWithMeta, getApiToken } from '@/lib/api'
import { cacheApiUsers } from './users.service'
import { extractTags } from '@/lib/utils'

export interface PostsPage {
  posts: Post[]
  hasMore: boolean
  nextPage: number | null
}

interface ApiPost {
  _id?: string
  id?: string
  authorId?: string
  userId?: string
  ownerId?: string
  user?: ApiAuthor
  author?: ApiAuthor
  content?: string
  text?: string
  body?: string
  image?: string
  images?: string[]
  imageUrls?: string[]
  feeling?: string
  createdAt?: string
  updatedAt?: string
  likes?: Array<string | { _id?: string; id?: string }>
  reactions?: Record<string, ReactionKind>
  comments?: Comment[]
  commentsCount?: number | string
  commentCount?: number | string
  comments_count?: number | string
  shares?: number | string
  sharesCount?: number | string
  shareCount?: number | string
  shares_count?: number | string
  sharedBy?: string[]
}

interface ApiAuthor {
  _id?: string
  id?: string
  name?: string
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  profilePhoto?: string
  photo?: string
  avatar?: string
  image?: string
  bio?: string
  location?: string
  work?: string
  cover?: string
  createdAt?: string
  joinedAt?: string
}

interface PostsApiPayload {
  posts?: ApiPost[]
  items?: ApiPost[]
  meta?: Record<string, unknown>
  [key: string]: unknown
}

function mapApiAuthor(apiPost: ApiPost): User | null {
  const author = apiPost.user || apiPost.author
  const id = apiPost.authorId || apiPost.userId || apiPost.ownerId || author?._id || author?.id
  if (!author || !id) return null
  const name = author.name || author.username || [author.firstName, author.lastName].filter(Boolean).join(' ')
  if (!name) return null
  return {
    id,
    name,
    email: author.email || '',
    avatar: author.profilePhoto || author.photo || author.avatar || author.image || '',
    bio: author.bio || '',
    location: author.location || '',
    work: author.work || '',
    cover: author.cover || 'from-sky-400 via-indigo-500 to-violet-600',
    joinedAt: author.joinedAt || author.createdAt || '',
  }
}

function parseCount(value: number | string | undefined): number | undefined {
  const count = typeof value === 'string' ? Number(value) : value
  return typeof count === 'number' && Number.isFinite(count) && count >= 0
    ? Math.floor(count)
    : undefined
}

function mapApiPost(apiPost: ApiPost): Post {
  const author = apiPost.user || apiPost.author
  const authorId = apiPost.authorId || apiPost.userId || apiPost.ownerId || author?._id || author?.id || ''
  const likes = (apiPost.likes || []).map((like) =>
    typeof like === 'string' ? like : like._id || like.id || '',
  ).filter(Boolean)
  const images = apiPost.images?.length
    ? apiPost.images
    : apiPost.imageUrls?.length
      ? apiPost.imageUrls
      : apiPost.image
        ? [apiPost.image]
        : []
  const comments = apiPost.comments || []
  // Until remote comment loading/sending is supported, only count the
  // actual comments available in this browser, never an inaccessible total.
  const commentsCount = comments.length
  const shares = parseCount(apiPost.shares)
    ?? parseCount(apiPost.sharesCount)
    ?? parseCount(apiPost.shareCount)
    ?? parseCount(apiPost.shares_count)
    ?? apiPost.sharedBy?.length
    ?? 0

  return {
    id: apiPost._id || apiPost.id || '',
    authorId,
    content: apiPost.content || apiPost.text || apiPost.body || '',
    image: apiPost.image,
    images,
    feeling: apiPost.feeling,
    createdAt: apiPost.createdAt || new Date().toISOString(),
    updatedAt: apiPost.updatedAt,
    likes,
    reactions: apiPost.reactions,
    comments,
    commentsCount,
    shares,
    sharedBy: apiPost.sharedBy,
    source: 'api',
  }
}

/** Mirrors API posts locally so comments, reactions, bookmarks and profiles keep working. */
function cacheApiPosts(apiPosts: Post[]): void {
  if (apiPosts.length === 0) return
  const all = posts()
  const byId = new Map(all.map((post) => [post.id, post]))
  let changed = false
  apiPosts.forEach((apiPost) => {
    if (!apiPost.id) return
    const existing = byId.get(apiPost.id)
    if (!existing) {
      byId.set(apiPost.id, { ...apiPost, bookmarkedBy: apiPost.bookmarkedBy ?? [] })
      changed = true
      return
    }
    byId.set(apiPost.id, {
      ...existing,
      authorId: apiPost.authorId || existing.authorId,
      content: apiPost.content,
      image: apiPost.image,
      images: apiPost.images,
      feeling: apiPost.feeling,
      createdAt: apiPost.createdAt || existing.createdAt,
      commentsCount: existing.comments.length,
      shares: apiPost.shares,
      source: 'api',
      comments: existing.comments,
      reactions: existing.reactions ?? apiPost.reactions,
      likes: existing.likes.length ? existing.likes : apiPost.likes,
      bookmarkedBy: existing.bookmarkedBy ?? [],
      poll: existing.poll ?? apiPost.poll,
    })
    changed = true
  })
  if (changed) writeSilently(KEYS.posts, [...byId.values()])
}

export async function listPostsPage(viewerId: string | undefined, page = 1, limit = 10): Promise<PostsPage> {
  ensureDB()
  const hidden = viewerId ? read<Record<string, string[]>>(KEYS.hiddenPosts, {})[viewerId] ?? [] : []
  const localSession = read<{ userId: string } | null>(KEYS.session, null)
  if (!localSession && getApiToken()) {
    const result = await apiRequestWithMeta<PostsApiPayload | ApiPost[]>(
      `/posts/feed?only=all&page=${page}&limit=${limit}`,
    )
    const payload = result.data
    const rawPosts = Array.isArray(payload) ? payload : payload.posts || payload.items || []
    const meta = (result.meta || (!Array.isArray(payload) ? payload.meta : undefined)) as
      | { page?: number; pages?: number; totalPages?: number; hasNextPage?: boolean; nextPage?: number | null }
      | undefined
    const currentPage = meta?.page ?? page
    const totalPages = meta?.pages ?? meta?.totalPages
    const hasMore = meta?.hasNextPage
      ?? (meta?.nextPage !== undefined
        ? meta.nextPage !== null
        : totalPages != null
          ? currentPage < totalPages
          : rawPosts.length === limit)

    cacheApiUsers(rawPosts.map(mapApiAuthor).filter((author): author is User => author !== null))

    const reactionOverrides = read<Record<string, Record<string, ReactionKind>>>(KEYS.reactionOverrides, {})
    const deletedPosts = read<string[]>(KEYS.deletedPosts, [])
    const apiPosts = rawPosts
      .filter((post) => {
        const id = post._id || post.id
        return !!id && !deletedPosts.includes(id) && !hidden.includes(id)
      })
      .map(mapApiPost).map((post) => {
        const reactions = reactionOverrides[post.id]
        if (!reactions) return post
        return { ...post, reactions, likes: Object.keys(reactions) }
      })

    cacheApiPosts(apiPosts)
    return {
      posts: apiPosts.map((post) => getPost(post.id) ?? post),
      hasMore,
      nextPage: hasMore ? (meta?.nextPage ?? currentPage + 1) : null,
    }
  }

  await delay(220)
  const all = posts().filter((post) => !hidden.includes(post.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const start = (page - 1) * limit
  const pagePosts = all.slice(start, start + limit)
  return {
    posts: pagePosts,
    hasMore: start + limit < all.length,
    nextPage: start + limit < all.length ? page + 1 : null,
  }
}

function posts(): Post[] {
  return read<Post[]>(KEYS.posts, []).map((post) => ({ ...post, commentsCount: post.comments.length }))
}

export async function listPosts(viewerId?: string): Promise<Post[]> {
  const firstPage = await listPostsPage(viewerId, 1, 100)
  return firstPage.posts
}

export function getPost(id: string): Post | undefined {
  return posts().find((post) => post.id === id)
}

/** Resolves a shared post by id, walking API pages when necessary. */
export async function findPostById(id: string): Promise<Post | undefined> {
  const local = getPost(id)
  if (local) return local
  if (!getApiToken()) return undefined
  for (let page = 1; page <= 10; page += 1) {
    const result = await listPostsPage(undefined, page, 20)
    const found = result.posts.find((post) => post.id === id)
    if (found) return found
    if (!result.hasMore) break
  }
  return undefined
}

export function getPostsByAuthor(authorId: string): Post[] {
  return posts()
    .filter((post) => post.authorId === authorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createPost(
  authorId: string,
  content: string,
  images?: string[],
  feeling?: string,
  poll?: Poll,
): Promise<Post> {
  ensureDB()
  const localSession = read<{ userId: string } | null>(KEYS.session, null)
  const list = images ?? []
  if (!content.trim() && list.length === 0 && !poll) {
    throw new Error(pick('اكتب شيئًا أو أضف صورة قبل النشر', 'Write something or add a photo before posting'))
  }

  if (!localSession && getApiToken()) {
    // The posts API contract has no poll field; polls are a local demo feature.
    // Refuse loudly instead of silently dropping the poll the user just wrote.
    if (poll) {
      throw new Error(pick(
        'الاستطلاعات غير متاحة أثناء الربط بالخادم حاليًا. انشر بدون استطلاع، أو جرّبها من حساب تجريبي محلي.',
        'Polls are not available while connected to the server yet. Publish without the poll, or try it from a local demo account.',
      ))
    }
    const requestPayload: Record<string, unknown> = { body: content.trim(), feeling }
    if (list.length > 0) {
      requestPayload.images = list
      requestPayload.image = list[0]
    }
    const payload = await apiRequest<ApiPost | { post?: ApiPost }>('/posts', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    })
    const apiPost = 'post' in payload && payload.post ? payload.post : payload as ApiPost
    const mapped = mapApiPost(apiPost)
    const normalized: Post = {
      ...mapped,
      authorId: mapped.authorId || authorId,
      content: mapped.content || content.trim(),
      source: 'api',
    }
    cacheApiPosts([normalized])
    return normalized
  }

  await delay(500)
  const post: Post = {
    id: uid('p'), authorId, content: content.trim(), images: list, feeling, poll,
    createdAt: new Date().toISOString(), likes: [], comments: [], shares: 0,
    bookmarkedBy: [], source: 'local',
  }
  write(KEYS.posts, [post, ...posts()])
  return post
}

export async function updatePost(postId: string, authorId: string, patch: { content: string; images: string[] }): Promise<Post> {
  ensureDB()
  await delay(300)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (!post || post.authorId !== authorId) throw new Error(pick('لا تملك صلاحية تعديل هذا المنشور', 'You are not allowed to edit this post'))
  if (!patch.content.trim() && patch.images.length === 0) throw new Error(pick('أضف نصًا أو صورة قبل حفظ التعديلات', 'Add text or a photo before saving'))
  post.content = patch.content.trim()
  post.images = [...patch.images]
  delete post.image
  post.updatedAt = new Date().toISOString()
  write(KEYS.posts, all)
  return post
}

export async function hidePost(postId: string, userId: string): Promise<void> {
  ensureDB()
  const hidden = read<Record<string, string[]>>(KEYS.hiddenPosts, {})
  const userHidden = hidden[userId] ?? []
  if (!userHidden.includes(postId)) hidden[userId] = [...userHidden, postId]
  write(KEYS.hiddenPosts, hidden)
}

export async function unhidePost(postId: string, userId: string): Promise<void> {
  ensureDB()
  const hidden = read<Record<string, string[]>>(KEYS.hiddenPosts, {})
  hidden[userId] = (hidden[userId] ?? []).filter((id) => id !== postId)
  write(KEYS.hiddenPosts, hidden)
}

export function getHiddenCommentIds(userId: string): string[] {
  return read<Record<string, string[]>>(KEYS.hiddenComments, {})[userId] ?? []
}

export async function hideComment(commentId: string, userId: string): Promise<void> {
  ensureDB()
  const hidden = read<Record<string, string[]>>(KEYS.hiddenComments, {})
  const userHidden = hidden[userId] ?? []
  if (!userHidden.includes(commentId)) hidden[userId] = [...userHidden, commentId]
  write(KEYS.hiddenComments, hidden)
}

export async function updateComment(postId: string, commentId: string, authorId: string, content: string): Promise<Comment> {
  ensureDB()
  await delay(180)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  const comment = post?.comments.find((item) => item.id === commentId)
  if (!comment || comment.authorId !== authorId) throw new Error(pick('لا تملك صلاحية تعديل هذا التعليق', 'You are not allowed to edit this comment'))
  if (!content.trim()) throw new Error(pick('لا يمكن أن يكون التعليق فارغًا', 'A comment cannot be empty'))
  comment.content = content.trim()
  comment.updatedAt = new Date().toISOString()
  write(KEYS.posts, all)
  return comment
}

export async function deleteComment(postId: string, commentId: string, authorId: string): Promise<void> {
  ensureDB()
  await delay(180)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  const comment = post?.comments.find((item) => item.id === commentId)
  if (!post || !comment || comment.authorId !== authorId) throw new Error(pick('لا تملك صلاحية حذف هذا التعليق', 'You are not allowed to delete this comment'))
  post.comments = post.comments.filter((item) => item.id !== commentId)
  post.commentsCount = post.comments.length
  write(KEYS.posts, all)
}

export async function setReaction(postId: string, userId: string, reaction: ReactionKind | null): Promise<Post> {
  ensureDB()
  await delay(120)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (!post) {
    if (!getApiToken()) throw new Error(pick('المنشور غير موجود', 'Post not found'))
    const overrides = read<Record<string, Record<string, ReactionKind>>>(KEYS.reactionOverrides, {})
    const reactions = { ...(overrides[postId] ?? {}) }
    if (reaction) reactions[userId] = reaction
    else delete reactions[userId]
    overrides[postId] = reactions
    writeSilently(KEYS.reactionOverrides, overrides)
    return {
      id: postId, authorId: '', content: '', createdAt: new Date().toISOString(),
      likes: Object.keys(reactions), reactions, comments: [], shares: 0,
    }
  }
  const reactions = post.reactions ?? Object.fromEntries(post.likes.map((id) => [id, 'like' as const]))
  const hadReaction = Object.prototype.hasOwnProperty.call(reactions, userId)
  if (reaction) reactions[userId] = reaction
  else delete reactions[userId]
  post.reactions = reactions
  post.likes = Object.keys(reactions)
  writeSilently(KEYS.posts, all)
  if (!hadReaction && reaction && post.authorId !== userId) {
    pushNotification({ userId: post.authorId, type: 'like', actorId: userId, text: 'أعجب بمنشورك', href: '/feed' })
  }
  return post
}

export async function toggleLike(postId: string, userId: string): Promise<Post> {
  const post = getPost(postId)
  if (!post) throw new Error(pick('المنشور غير موجود', 'Post not found'))
  return setReaction(postId, userId, post.likes.includes(userId) ? null : 'like')
}

export async function addComment(postId: string, authorId: string, content: string): Promise<Comment> {
  ensureDB()
  if (!content.trim()) throw new Error(pick('لا يمكن أن يكون التعليق فارغًا', 'A comment cannot be empty'))
  await delay(280)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (!post) throw new Error(pick('المنشور غير موجود', 'Post not found'))
  const comment: Comment = {
    id: uid('c'), postId, authorId, content: content.trim(),
    createdAt: new Date().toISOString(), likes: [],
  }
  post.comments.push(comment)
  post.commentsCount = post.comments.length
  write(KEYS.posts, all)
  if (post.authorId !== authorId) {
    pushNotification({
      userId: post.authorId, type: 'comment', actorId: authorId,
      text: `علّق على منشورك: «${comment.content.slice(0, 60)}»`, href: '/feed',
    })
  }
  return comment
}

export async function toggleCommentLike(postId: string, commentId: string, userId: string): Promise<void> {
  ensureDB()
  const all = posts()
  const post = all.find((item) => item.id === postId)
  const comment = post?.comments.find((item) => item.id === commentId)
  if (!comment) return
  comment.likes = comment.likes.includes(userId)
    ? comment.likes.filter((id) => id !== userId)
    : [...comment.likes, userId]
  write(KEYS.posts, all)
}

export async function sharePost(postId: string, userId: string): Promise<Post> {
  ensureDB()
  await delay(220)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (!post) throw new Error(pick('المنشور غير موجود', 'Post not found'))
  const sharedBy = post.sharedBy ?? []
  if (sharedBy.includes(userId)) return post
  post.sharedBy = [...sharedBy, userId]
  post.shares += 1
  write(KEYS.posts, all)
  if (post.authorId !== userId) {
    pushNotification({ userId: post.authorId, type: 'share', actorId: userId, text: 'شارك منشورك', href: '/feed' })
  }
  return post
}

export async function deletePost(postId: string, authorId: string): Promise<void> {
  ensureDB()
  await delay(300)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (post) {
    if (post.authorId !== authorId) throw new Error(pick('لا تملك صلاحية حذف هذا المنشور', 'You are not allowed to delete this post'))
    if (post.source === 'api' && getApiToken()) {
      await apiRequest(`/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' })
    }
    write(KEYS.posts, all.filter((item) => item.id !== postId))
    return
  }

  if (getApiToken()) {
    await apiRequest(`/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' })
    const deletedPosts = read<string[]>(KEYS.deletedPosts, [])
    writeSilently(KEYS.deletedPosts, [...deletedPosts.filter((id) => id !== postId), postId])
    return
  }
  throw new Error(pick('لا تملك صلاحية حذف هذا المنشور', 'You are not allowed to delete this post'))
}

// --- Bookmarks ---------------------------------------------------------------

export function isBookmarked(postId: string, userId: string): boolean {
  return !!getPost(postId)?.bookmarkedBy?.includes(userId)
}

export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  ensureDB()
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (!post) throw new Error(pick('المنشور غير موجود', 'Post not found'))
  const bookmarkedBy = post.bookmarkedBy ?? []
  const next = bookmarkedBy.includes(userId)
    ? bookmarkedBy.filter((id) => id !== userId)
    : [...bookmarkedBy, userId]
  post.bookmarkedBy = next
  write(KEYS.posts, all)
  return next.includes(userId)
}

export function getBookmarkedPosts(userId: string): Post[] {
  return posts()
    .filter((post) => post.bookmarkedBy?.includes(userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// --- Polls -------------------------------------------------------------------

export async function votePoll(postId: string, optionId: string, userId: string): Promise<Post> {
  ensureDB()
  await delay(160)
  const all = posts()
  const post = all.find((item) => item.id === postId)
  if (!post?.poll) throw new Error(pick('لا يوجد استطلاع في هذا المنشور', 'This post has no poll'))
  if (post.poll.closesAt && new Date(post.poll.closesAt).getTime() < Date.now()) {
    throw new Error(pick('انتهى الاستطلاع', 'This poll has closed'))
  }
  const option = post.poll.options.find((item) => item.id === optionId)
  if (!option) throw new Error(pick('الخيار غير موجود', 'Option not found'))
  const voted = post.poll.options.some((item) => item.votes.includes(userId))
  if (voted && !post.poll.multiple) throw new Error(pick('صوّتت في هذا الاستطلاع من قبل', 'You already voted in this poll'))
  if (option.votes.includes(userId)) throw new Error(pick('اخترت هذا الخيار من قبل', 'You already picked this option'))
  option.votes.push(userId)
  write(KEYS.posts, all)
  return post
}

// --- Reports & discovery -----------------------------------------------------

export async function reportPost(postId: string, reporterId: string, reason: string): Promise<void> {
  ensureDB()
  await delay(200)
  const reports = read<Report[]>(KEYS.reports, [])
  if (reports.some((item) => item.reporterId === reporterId && item.targetType === 'post' && item.targetId === postId)) {
    throw new Error(pick('أبلغت عن هذا المنشور من قبل', 'You already reported this post'))
  }
  reports.push({
    id: uid('r'), reporterId, targetType: 'post', targetId: postId,
    reason: reason.trim() || pick('محتوى غير لائق', 'Inappropriate content'),
    createdAt: new Date().toISOString(),
  })
  write(KEYS.reports, reports)
}

export function searchPosts(query: string): Post[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return posts()
    .filter((post) => post.content.toLowerCase().includes(q) ||
      post.feeling?.toLowerCase().includes(q) ||
      extractTags(post.content).some((tag) => tag.includes(q.replace(/^#/, ''))))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getPostsByHashtag(tag: string): Post[] {
  const clean = tag.replace(/^#/, '').toLowerCase()
  return posts().filter((post) => extractTags(post.content).includes(clean))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getTrendingTags(limit = 8): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>()
  posts().forEach((post) => extractTags(post.content).forEach((tag) => {
    counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }))
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit)
}
