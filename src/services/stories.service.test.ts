import { beforeEach, describe, expect, it } from 'vitest'
import { resetDB } from './db'
import { createStory, deleteStory, listStories } from './stories.service'

beforeEach(() => {
  localStorage.clear()
  resetDB()
})

describe('stories.service', () => {
  it('keeps story text and expires the story after 24 hours', async () => {
    const story = await createStory('u1', 'A story with text')
    const persisted = (await listStories()).find((item) => item.id === story.id)

    expect(persisted?.content).toBe('A story with text')
    expect(Date.parse(story.expiresAt) - Date.parse(story.createdAt)).toBe(24 * 60 * 60 * 1000)
  })

  it('lets the story owner delete a story and rejects other users', async () => {
    const story = await createStory('u1', 'A story to delete')

    await expect(deleteStory(story.id, 'u2')).rejects.toThrow()
    await deleteStory(story.id, 'u1')

    expect(await listStories()).not.toContainEqual(expect.objectContaining({ id: story.id }))
  })
})
