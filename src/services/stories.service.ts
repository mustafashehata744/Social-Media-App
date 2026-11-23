import { pick } from '@/lib/lang'
import { delay, read, uid, write } from '@/lib/storage'
import { KEYS, ensureDB } from './db'
import type { Story } from '@/types'

function activeStories(): Story[] {
  const now = Date.now()
  return read<Story[]>(KEYS.stories, []).filter((story) => new Date(story.expiresAt).getTime() > now)
}

export async function listStories(): Promise<Story[]> {
  ensureDB()
  await delay(120)
  const stored = read<Story[]>(KEYS.stories, [])
  const active = stored.filter((story) => new Date(story.expiresAt).getTime() > Date.now())
  if (active.length !== stored.length) write(KEYS.stories, active)
  return active.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function createStory(authorId: string, content: string, image?: string): Promise<Story> {
  ensureDB()
  await delay(250)
  if (!content.trim() && !image) throw new Error(pick('أضف نصًا أو صورة إلى قصتك', 'Add text or a photo to your story'))
  const createdAt = new Date()
  const story: Story = {
    id: uid('story'),
    authorId,
    content: content.trim(),
    image,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  }
  write(KEYS.stories, [...activeStories(), story])
  return story
}

export function viewStory(storyId: string, viewerId: string): void {
  const all = read<Story[]>(KEYS.stories, [])
  const story = all.find((item) => item.id === storyId)
  if (!story || story.authorId === viewerId) return
  const viewedBy = story.viewedBy ?? []
  if (viewedBy.includes(viewerId)) return
  story.viewedBy = [...viewedBy, viewerId]
  write(KEYS.stories, all)
}

export async function replyToStory(storyId: string, authorId: string, text: string): Promise<void> {
  ensureDB()
  await delay(180)
  if (!text.trim()) return
  const all = read<Story[]>(KEYS.stories, [])
  const story = all.find((item) => item.id === storyId)
  if (!story) return
  story.replies = [...(story.replies ?? []), {
    id: uid('sr'), authorId, text: text.trim(), createdAt: new Date().toISOString(),
  }]
  write(KEYS.stories, all)
}

export async function toggleStoryHighlight(storyId: string, authorId: string): Promise<boolean> {
  ensureDB()
  const all = read<Story[]>(KEYS.stories, [])
  const story = all.find((item) => item.id === storyId)
  if (!story || story.authorId !== authorId) throw new Error(pick('لا يمكنك تعديل هذه القصة', 'You cannot edit this story'))
  story.highlight = !story.highlight
  write(KEYS.stories, all)
  return story.highlight
}

export function listHighlights(authorId: string): Story[] {
  return read<Story[]>(KEYS.stories, []).filter((story) => story.authorId === authorId && story.highlight)
}

export async function deleteStory(storyId: string, authorId: string): Promise<void> {
  ensureDB()
  await delay(120)
  const all = read<Story[]>(KEYS.stories, [])
  const story = all.find((item) => item.id === storyId)
  if (!story) throw new Error(pick('القصة غير موجودة', 'Story not found'))
  if (story.authorId !== authorId) throw new Error(pick('لا يمكنك حذف قصة شخص آخر', 'You cannot delete someone else’s story'))
  write(KEYS.stories, all.filter((item) => item.id !== storyId))
}
