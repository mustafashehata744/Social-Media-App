import { beforeEach, describe, expect, it } from 'vitest'
import { pick } from './lang'

beforeEach(() => localStorage.clear())

describe('pick', () => {
  it('defaults to Arabic', () => {
    expect(pick('مرحبا', 'Hello')).toBe('مرحبا')
  })

  it('returns English when the preference is en', () => {
    localStorage.setItem('tawasol:language-preference', JSON.stringify('en'))
    expect(pick('مرحبا', 'Hello')).toBe('Hello')
  })
})
