import { pick } from '@/lib/lang'
import { delay, read, remove, uid, write } from '@/lib/storage'
import { emailIsValid } from '@/lib/utils'
import { hashPassword, verifyPassword } from '@/lib/security'
import { DEMO_RESET_CODE } from '@/data/demo'
import { defaultSettings } from '@/data/seed'
import { KEYS, ensureDB } from './db'
import { persistCachedApiUser } from './users.service'
import type { Credential, User, UserSettings } from '@/types'
import {
  apiRequest, clearApiSession, getApiToken, getCachedApiUser, setApiToken, setCachedApiUser,
} from '@/lib/api'
import avatar1 from '@/img/demo-avatar-1.jpg'

interface ApiUser {
  _id?: string
  id?: string
  name?: string
  username?: string
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

interface AuthApiPayload {
  token?: string
  accessToken?: string
  user?: ApiUser
  data?: ApiUser | AuthApiPayload
}

interface PasswordReset {
  userId: string
  code: string
  expiresAt: string
}

function apiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser._id || apiUser.id || '',
    name: apiUser.name || apiUser.username || '',
    email: apiUser.email || '',
    avatar: apiUser.profilePhoto || apiUser.photo || apiUser.avatar || apiUser.image || '',
    bio: apiUser.bio || '',
    location: apiUser.location || '',
    work: apiUser.work || '',
    cover: apiUser.cover || 'from-sky-400 via-indigo-500 to-violet-600',
    joinedAt: apiUser.joinedAt || apiUser.createdAt || new Date().toISOString(),
  }
}

function cacheApiUser(user: User): User {
  setCachedApiUser(user)
  return user
}

function resolveAuthPayload(payload: AuthApiPayload): { token: string | null; user: ApiUser | null } {
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as AuthApiPayload
    if (nested.token || nested.accessToken || nested.user) {
      return {
        token: payload.token || payload.accessToken || nested.token || nested.accessToken || null,
        user: payload.user || nested.user || null,
      }
    }
  }
  return {
    token: payload.token || payload.accessToken || null,
    user: payload.user || (payload.data as ApiUser) || (payload as unknown as ApiUser),
  }
}

export interface RegisterInput {
  name: string
  username?: string
  email: string
  password: string
  confirmPassword: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
}

function findLocalUser(email: string): User | undefined {
  return read<User[]>(KEYS.users, []).find((item) =>
    item.email.toLowerCase() === email.trim().toLowerCase())
}

function credentialsFor(userId: string): Credential | undefined {
  return read<Credential[]>(KEYS.credentials, []).find((item) => item.userId === userId)
}

function localCredentialsMatch(email: string, password: string): boolean {
  const user = findLocalUser(email)
  if (!user) return false
  const credential = credentialsFor(user.id)
  return !!credential && verifyPassword(password, credential.hash, credential.salt)
}

export function getCurrentUser(): User | null {
  ensureDB()
  const session = read<{ userId: string } | null>(KEYS.session, null)
  if (session) {
    const user = read<User[]>(KEYS.users, []).find((item) => item.id === session.userId)
    if (user) return user
  }
  if (getApiToken()) {
    persistCachedApiUser()
    return getCachedApiUser()
  }
  return null
}

function mergeApiUser(apiUser: User, cachedUser: User | null): User {
  // Locally saved edits survive logout, so they take precedence over the
  // server's copy of the same account.
  const storedUser = read<User[]>(KEYS.users, []).find((item) => item.id === apiUser.id) || null
  const base = storedUser ? { ...apiUser, ...storedUser, id: apiUser.id } : apiUser
  if (!cachedUser || cachedUser.id !== apiUser.id) return base
  return { ...base, ...cachedUser, id: apiUser.id }
}

export async function login(email: string, password: string): Promise<User> {
  if (import.meta.env.MODE === 'test') return loginLocal(email, password)

  ensureDB()
  if (localCredentialsMatch(email, password)) return loginLocal(email, password)

  try {
    return await loginWithApi(email, password)
  } catch (error) {
    if (localCredentialsMatch(email, password)) return loginLocal(email, password)
    throw error
  }
}

/** Signs in against the remote API and caches the returned session. Exported for direct API-path tests. */
export async function loginWithApi(email: string, password: string): Promise<User> {
  const payload = await apiRequest<AuthApiPayload>('/users/signin', {
    method: 'POST',
    body: JSON.stringify({ login: email.trim(), email: email.trim(), password }),
  })
  const { token, user: apiUser } = resolveAuthPayload(payload)
  if (!token) throw new Error(pick('لم يرجع الخادم رمز تسجيل الدخول', 'The server did not return a login token'))
  if (!apiUser || typeof apiUser !== 'object') throw new Error(pick('لم يرجع الخادم بيانات المستخدم', 'The server did not return user data'))
  const serverUser = apiUserToUser(apiUser)
  const cachedUser = getCachedApiUser()
  setApiToken(token)
  remove(KEYS.session)
  return cacheApiUser(mergeApiUser(serverUser, cachedUser))
}

/** True when the active session came from the remote API rather than the local demo data. */
export function isApiMode(): boolean {
  return !read<{ userId: string } | null>(KEYS.session, null) && !!getApiToken()
}

export async function loginLocal(email: string, password: string): Promise<User> {
  ensureDB()
  await delay(500)
  const user = findLocalUser(email)
  if (!user) throw new Error(pick('لا يوجد حساب مسجّل بهذا البريد الإلكتروني', 'No account is registered with this email'))
  if (!localCredentialsMatch(email, password)) {
    throw new Error(pick('كلمة المرور غير صحيحة، حاول مرة أخرى', 'Incorrect password, please try again'))
  }

  clearApiSession()
  write(KEYS.session, { userId: user.id, loginAt: new Date().toISOString() })
  return user
}

export async function register(input: RegisterInput): Promise<User> {
  if (import.meta.env.MODE === 'test') return registerLocal(input)

  const name = input.name.trim()
  const username = (input.username || name).trim().toLowerCase()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error(pick('الاسم الكامل مطلوب', 'Full name is required'))
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error(pick(
      'اسم المستخدم يجب أن يكون 3–30 حرفًا ويحتوي أحرفًا إنجليزية صغيرة وأرقامًا وشرطة سفلية فقط',
      'Username must be 3–30 characters using lowercase letters, numbers, and underscores only',
    ))
  }
  if (!input.dateOfBirth) throw new Error(pick('تاريخ الميلاد مطلوب', 'Date of birth is required'))
  if (input.gender !== 'male' && input.gender !== 'female') {
    throw new Error(pick('اختر النوع', 'Select a gender'))
  }
  if (!emailIsValid(email)) throw new Error(pick('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address'))
  if (!/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(input.password)) {
    throw new Error(pick(
      'كلمة المرور ٨ أحرف على الأقل وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا',
      'Password must be 8+ characters with uppercase, lowercase, a number, and a symbol',
    ))
  }
  if (input.password !== input.confirmPassword) throw new Error(pick('تأكيد كلمة المرور غير مطابق', 'Passwords do not match'))

  return registerWithApi(input)
}

/** Registers against the remote API. Exported for direct API-path tests. */
export async function registerWithApi(input: RegisterInput): Promise<User> {
  const name = input.name.trim()
  const username = (input.username || name).trim().toLowerCase()
  const email = input.email.trim().toLowerCase()
  const payload = await apiRequest<AuthApiPayload>('/users/signup', {
    method: 'POST',
    body: JSON.stringify({
      name,
      username,
      email,
      password: input.password,
      rePassword: input.confirmPassword,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
    }),
  })
  const { token, user: apiUser } = resolveAuthPayload(payload)
  if (!token) throw new Error(pick('لم يرجع الخادم رمز تسجيل الدخول', 'The server did not return a login token'))
  if (!apiUser || typeof apiUser !== 'object') throw new Error(pick('لم يرجع الخادم بيانات المستخدم', 'The server did not return user data'))
  const serverUser = apiUserToUser(apiUser)
  const cachedUser = getCachedApiUser()
  setApiToken(token)
  remove(KEYS.session)
  return cacheApiUser(mergeApiUser(serverUser, cachedUser))
}

export async function registerLocal(input: RegisterInput): Promise<User> {
  ensureDB()
  await delay(650)

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error(pick('الاسم الكامل مطلوب', 'Full name is required'))
  if (!emailIsValid(email)) throw new Error(pick('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address'))
  if (input.password.length < 6) throw new Error(pick('كلمة المرور يجب أن تكون ٦ أحرف على الأقل', 'Password must be at least 6 characters'))
  if (input.password !== input.confirmPassword) throw new Error(pick('تأكيد كلمة المرور غير مطابق', 'Passwords do not match'))

  const users = read<User[]>(KEYS.users, [])
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error(pick('هذا البريد الإلكتروني مستخدم بالفعل', 'This email is already in use'))
  }

  const user: User = {
    id: uid('u'),
    name,
    email,
    avatar: avatar1,
    bio: 'عضو جديد في تواصل 👋',
    location: '',
    work: '',
    cover: 'from-sky-400 via-indigo-500 to-violet-600',
    joinedAt: new Date().toISOString(),
  }

  const credentials = read<Credential[]>(KEYS.credentials, [])
  write(KEYS.credentials, [...credentials, {
    userId: user.id, salt: 'tawasol-demo-v1', hash: hashPassword(input.password),
  }])
  write(KEYS.users, [...users, user])
  const settings = read<Record<string, UserSettings>>(KEYS.settings, {})
  settings[user.id] = defaultSettings(user.id)
  write(KEYS.settings, settings)
  clearApiSession()
  write(KEYS.session, { userId: user.id, loginAt: new Date().toISOString() })

  return user
}

/** Demo-only reset flow. A real instance must delegate this to the server. */
export function requestPasswordReset(email: string): { local: boolean; code: string } {
  ensureDB()
  const user = findLocalUser(email)
  if (!user) return { local: false, code: '' }
  write(KEYS.passwordResets, [
    ...read<PasswordReset[]>(KEYS.passwordResets, []).filter((item) => item.userId !== user.id),
    { userId: user.id, code: DEMO_RESET_CODE, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() },
  ])
  return { local: true, code: DEMO_RESET_CODE }
}

export function resetPassword(email: string, code: string, newPassword: string): void {
  ensureDB()
  const user = findLocalUser(email)
  const reset = read<PasswordReset[]>(KEYS.passwordResets, []).find((item) => item.userId === user?.id)
  if (!user || !reset) throw new Error(pick('طلب إعادة التعيين غير موجود', 'No reset request found'))
  if (reset.expiresAt < new Date().toISOString()) throw new Error(pick('انتهت صلاحية رمز إعادة التعيين', 'The reset code has expired'))
  if (reset.code !== code.trim()) throw new Error(pick('رمز إعادة التعيين غير صحيح', 'Incorrect reset code'))
  if (newPassword.length < 6) throw new Error(pick('كلمة المرور يجب أن تكون ٦ أحرف على الأقل', 'Password must be at least 6 characters'))

  const credentials = read<Credential[]>(KEYS.credentials, [])
  const index = credentials.findIndex((item) => item.userId === user.id)
  const updated = { userId: user.id, salt: 'tawasol-demo-v1', hash: hashPassword(newPassword) }
  if (index === -1) credentials.push(updated)
  else credentials[index] = updated
  write(KEYS.credentials, credentials)
  write(KEYS.passwordResets, read<PasswordReset[]>(KEYS.passwordResets, []).filter((item) => item.userId !== user.id))
}

export function logout(): void {
  clearApiSession()
  remove(KEYS.session)
}
