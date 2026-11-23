import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDB } from './db'
import { addComment, createPost, deleteComment, deletePost, getPost, listPostsPage, setReaction, sharePost } from './posts.service'
import { setApiToken } from '@/lib/api'
import { getUser } from './users.service'

beforeEach(() => {
  localStorage.clear()
  resetDB()
})

describe('posts.service', () => {
  it('creates a post and rejects an empty one', async () => {
    const post = await createPost('u_test', 'hello')
    expect(getPost(post.id)?.content).toBe('hello')
    await expect(createPost('u_test', '   ')).rejects.toThrow()
  })

  it('creates a text-only API post with a body field', async () => {
    setApiToken('test-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { id: 'api-text-post', body: 'hello from API' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await createPost('u_test', 'hello from API')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const requestPayload = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(requestPayload.body).toBe('hello from API')
    expect(requestPayload).not.toHaveProperty('content')
    expect(requestPayload).not.toHaveProperty('text')
    expect(requestPayload).not.toHaveProperty('image')
    expect(requestPayload).not.toHaveProperty('images')
    setApiToken(null)
  })

  it('counts a share only once per user', async () => {
    const post = await createPost('u_author', 'share me')
    await sharePost(post.id, 'u_a')
    await sharePost(post.id, 'u_a')
    await sharePost(post.id, 'u_b')
    expect(getPost(post.id)?.shares).toBe(2)
  })

  it('sets and clears a reaction', async () => {
    const post = await createPost('u_author', 'react')
    await setReaction(post.id, 'u_a', 'love')
    expect(getPost(post.id)?.likes).toEqual(['u_a'])
    await setReaction(post.id, 'u_a', null)
    expect(getPost(post.id)?.likes).toEqual([])
  })

  it('only lets the author delete a post', async () => {
    const post = await createPost('u_author', 'mine')
    await expect(deletePost(post.id, 'u_other')).rejects.toThrow()
    await deletePost(post.id, 'u_author')
    expect(getPost(post.id)).toBeUndefined()
  })

  it('adds a comment to a post', async () => {
    const post = await createPost('u_author', 'comment here')
    await addComment(post.id, 'u_a', ' nice ')
    expect(getPost(post.id)?.comments[0].content).toBe('nice')
  })

  it('uses total page metadata when the API omits nextPage and hasNextPage', async () => {
    setApiToken('test-token')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { posts: [{ id: 'api-post', content: 'hello' }] },
      meta: { page: 1, totalPages: 2 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(listPostsPage('u1')).resolves.toMatchObject({
      hasMore: true,
      nextPage: 2,
    })
  })

  it('caches API post authors with their names and profile photos', async () => {
    setApiToken('test-token')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        posts: [{
          id: 'api-post',
          content: 'hello',
          user: { _id: 'api-author', name: 'API Author', photo: 'https://example.com/avatar.jpg' },
        }],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await listPostsPage('u1')

    expect(getUser('api-author')).toMatchObject({
      name: 'API Author',
      avatar: 'https://example.com/avatar.jpg',
    })
  })

  it('counts only available comments, not inaccessible API totals', async () => {
    setApiToken('test-token')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        posts: [
          { id: 'api-post-1', content: 'first', commentsCount: 2, sharesCount: 1 },
          { id: 'api-post-2', content: 'second', commentCount: '7', shareCount: '3' },
        ],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    const result = await listPostsPage('u1')

    expect(result.posts.map(({ commentsCount, shares }) => [commentsCount, shares])).toEqual([[0, 1], [0, 3]])
  })
})

 it('keeps real comment counts after add, delete and a fresh read', async () => {
    const post = await createPost('u_author', 'comment lifecycle')
    expect(getPost(post.id)?.commentsCount).toBe(0)
    const comment = await addComment(post.id, 'u_a', 'visible comment')
    expect(getPost(post.id)?.commentsCount).toBe(1)
    expect(getPost(post.id)?.comments[0].content).toBe('visible comment')
    await deleteComment(post.id, comment.id, 'u_a')
    expect(getPost(post.id)?.commentsCount).toBe(0)
    await expect(addComment(post.id, 'u_a', '  ')).rejects.toThrow()
  })
