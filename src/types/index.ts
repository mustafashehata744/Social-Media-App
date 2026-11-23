export type ID = string

export interface User {
  id: ID
  name: string
  email: string
  avatar: string
  bio: string
  location: string
  work: string
  cover: string
  joinedAt: string
  verified?: boolean
  lastSeen?: string
  followers?: ID[]
  following?: ID[]
}

export interface Credential {
  userId: ID
  salt: string
  hash: string
}

export interface PollOption {
  id: ID
  text: string
  votes: ID[]
}

export interface Poll {
  question: string
  options: PollOption[]
  closesAt?: string
  multiple?: boolean
}

export interface Comment {
  id: ID
  postId: ID
  authorId: ID
  content: string
  createdAt: string
  updatedAt?: string
  likes: ID[]
}

export interface Post {
  id: ID
  authorId: ID
  content: string
  image?: string
  images?: string[]
  feeling?: string
  createdAt: string
  updatedAt?: string
  likes: ID[]
  reactions?: Record<ID, ReactionKind>
  comments: Comment[]
  commentsCount?: number
  shares: number
  sharedBy?: ID[]
  poll?: Poll
  bookmarkedBy?: ID[]
  reportedBy?: ID[]
  source?: 'local' | 'api'
}

export type ReactionKind = 'like' | 'love' | 'care'

export interface StoryReply {
  id: ID
  authorId: ID
  text: string
  createdAt: string
}

export interface Story {
  id: ID
  authorId: ID
  content: string
  image?: string
  createdAt: string
  expiresAt: string
  viewedBy?: ID[]
  replies?: StoryReply[]
  highlight?: boolean
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequest {
  id: ID
  fromId: ID
  toId: ID
  status: FriendRequestStatus
  createdAt: string
}

export interface Message {
  id: ID
  senderId: ID
  text: string
  createdAt: string
  read: boolean
  readAt?: string
  deliveredAt?: string
}

export interface Conversation {
  id: ID
  participantIds: [ID, ID]
  messages: Message[]
  updatedAt: string
  typing?: ID[]
}

export type NotificationType = 'like' | 'comment' | 'friend' | 'message' | 'share' | 'system'

export interface AppNotification {
  id: ID
  userId: ID
  type: NotificationType
  actorId?: ID
  text: string
  createdAt: string
  read: boolean
  href?: string
}

export type BackgroundPreset = 'default' | 'aurora' | 'sunset' | 'mint' | 'night'

export interface UserSettings {
  userId: ID
  theme: 'light' | 'dark' | 'system'
  background: BackgroundPreset
  language: 'ar' | 'en'
  notifyLikes: boolean
  notifyComments: boolean
  notifyFriends: boolean
  notifyMessages: boolean
  privateAccount: boolean
  showEmail: boolean
  themeSchedule?: boolean
  scheduleStart?: string
  scheduleEnd?: string
  pushNotifications?: boolean
}

export type ReportTarget = 'post' | 'comment' | 'user' | 'story' | 'message'

export interface Report {
  id: ID
  reporterId: ID
  targetType: ReportTarget
  targetId: string
  reason: string
  createdAt: string
}

export interface SearchEntry {
  query: string
  createdAt: string
}

export interface AuthResult {
  user: User
  token: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
