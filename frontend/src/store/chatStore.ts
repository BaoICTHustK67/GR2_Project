import { create } from 'zustand'
import { chatApi } from '@/lib/chatApi'
import type { Conversation, Message } from '@/types/chat'

type ChatState = {
  conversations: Conversation[]
  activeConversationId: number | null
  messagesByConversation: Record<number, Message[]>
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  error: string | null

  setActiveConversation: (id: number | null) => void
  fetchConversations: (silent?: boolean) => Promise<void>
  fetchMessages: (conversationId: number, silent?: boolean) => Promise<void>
  sendMessage: (conversationId: number, content: string) => Promise<void>
  startConversationWithUser: (userId: number) => Promise<number>
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  error: null,

  setActiveConversation: (id) => {
    set({ activeConversationId: id })
    if (id != null) get().fetchMessages(id)
  },

  fetchConversations: async (silent = false) => {
    try {
      if (!silent) set({ isLoadingConversations: true, error: null })
      const res = await chatApi.listConversations()
      set({ conversations: res.conversations })
    } catch (e: any) {
      if (!silent) set({ error: e?.message || 'Failed to load conversations' })
    } finally {
      if (!silent) set({ isLoadingConversations: false })
    }
  },

  fetchMessages: async (conversationId, silent = false) => {
    try {
      if (!silent) set({ isLoadingMessages: true, error: null })
      const res = await chatApi.getConversation(conversationId)
      // API returns newest-first; we display oldest-first
      const items = [...res.messages.items].reverse()
      set((s) => ({
        messagesByConversation: { ...s.messagesByConversation, [conversationId]: items },
      }))
    } catch (e: any) {
      if (!silent) set({ error: e?.message || 'Failed to load messages' })
    } finally {
      if (!silent) set({ isLoadingMessages: false })
    }
  },

  sendMessage: async (conversationId, content) => {
    const trimmed = content.trim()
    if (!trimmed) return

    try {
      set({ error: null })
      const res = await chatApi.sendMessage(conversationId, trimmed)
      set((s) => ({
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: [...(s.messagesByConversation[conversationId] || []), res.message],
        },
      }))
      // refresh conversation list for lastMessage/ordering
      get().fetchConversations()
    } catch (e: any) {
      set({ error: e?.message || 'Failed to send message' })
      throw e
    }
  },

  startConversationWithUser: async (userId) => {
    const res = await chatApi.createConversation([userId])
    const convoId = res.conversation.id
    await get().fetchConversations()
    return convoId
  },
}))
