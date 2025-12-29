import type { User } from './index'

export type Message = {
  id: number
  conversationId: number
  senderId: number
  content: string
  isRead: boolean
  sender?: User
  timestamp?: string
}

export type Conversation = {
  id: number
  participants: User[]
  otherParticipant?: User | null
  lastMessage?: Message | null
  updatedAt?: string
}

