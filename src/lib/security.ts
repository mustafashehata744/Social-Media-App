/**
 * Demo-only password hashing. This is NOT a cryptographic password hash and
 * must never be used for real accounts. Real authentication belongs on a server.
 */
export const DEMO_SALT = 'tawasol-demo-v1'

export function hashPassword(password: string, salt = DEMO_SALT): string {
  let first = 0x811c9dc5
  let second = 0x01000193
  const value = `${salt}:${password}`
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    first = Math.imul(first ^ code, 0x01000193) >>> 0
    second = Math.imul(second + code + index, 0x85ebca6b) >>> 0
  }
  first ^= first >>> 16
  second ^= second >>> 13
  return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}`
}

export function verifyPassword(password: string, hash: string, salt = DEMO_SALT): boolean {
  return hashPassword(password, salt) === hash
}
