import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './worker.mjs'

const origin = 'https://mustafashehata744.github.io'
function request(data, token = 'challenge') {
  return new Request('https://example.test/ai', { method: 'POST', headers: { Origin: origin, 'X-Turnstile-Token': token }, body: JSON.stringify(data) })
}
const base = { ALLOWED_ORIGIN: origin, TURNSTILE_SECRET: 'test-only', AI_LIMITER: { limit: async () => ({ success: true }) } }

test('rejects missing configuration and foreign origins before model access', async () => {
  assert.equal((await worker.fetch(request({}), {})).status, 403)
  assert.equal((await worker.fetch(request({}), { ALLOWED_ORIGIN: origin })).status, 503)
})
test('rejects missing challenges, oversized input and rate-limited requests', async () => {
  const env = { ...base, AI: {} }
  assert.equal((await worker.fetch(request({}, ''), env)).status, 403)
  assert.equal((await worker.fetch(request({ messages: [{ role: 'user', content: 'x'.repeat(10001) }] }), env)).status, 400)
  assert.equal((await worker.fetch(request({}), { ...env, AI_LIMITER: { limit: async () => ({ success: false }) } })).status, 429)
})
test('requires hostname and action validation before inference', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => Response.json({ success: true, hostname: 'other.example', action: 'tawasol-ai' })
  try {
    const result = await worker.fetch(request({ messages: [{ role: 'user', content: 'translate' }] }), { ...base, AI: { run: () => { throw new Error('should not run') } } })
    assert.equal(result.status, 403)
  } finally { globalThis.fetch = original }
})
test('fixes model and output cap, returns only response contract', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => Response.json({ success: true, hostname: 'mustafashehata744.github.io', action: 'tawasol-ai' })
  let called = false
  try {
    const env = { ...base, AI: { run: async (model, payload) => {
      called = true
      assert.equal(model, '@cf/google/gemma-4-26b-a4b-it')
      assert.equal(payload.max_tokens, 900)
      assert.equal(payload.messages[0].role, 'system')
      assert.equal(payload.messages[1].role, 'user')
      return { response: 'Hello' }
    } } }
    const result = await worker.fetch(request({ model: 'expensive-other', messages: [{ role: 'system', content: 'Translation task' }] }), env)
    assert.equal(result.status, 200)
    assert.equal((await result.json()).choices[0].message.content, 'Hello')
    assert.ok(called)
  } finally { globalThis.fetch = original }
})
