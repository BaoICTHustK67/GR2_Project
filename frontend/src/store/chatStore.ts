import { create } from 'zustand'
import { chatApi } from '@/lib/chatApi'
import type { Conversation, Message } from '@/types/chat'
import { io, Socket } from 'socket.io-client'

type ChatState = {
  conversations: Conversation[]
  activeConversationId: number | null
  messagesByConversation: Record<number, Message[]>
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  error: string | null
  socket: Socket | null

  setActiveConversation: (id: number | null) => void
  fetchConversations: (silent?: boolean) => Promise<void>
  fetchMessages: (conversationId: number, silent?: boolean) => Promise<void>
  sendMessage: (conversationId: number, content: string) => Promise<void>
  startConversationWithUser: (userId: number) => Promise<number>
  
  connectSocket: () => void
  disconnectSocket: () => void
  joinConversation: (id: number) => void
  leaveConversation: (id: number) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  error: null,

  socket: null,
  
   setActiveConversation: (id) => {
     set({ activeConversationId: id })
     if (id != null) {
        get().fetchMessages(id)
        get().joinConversation(id)
     }
   },

   joinConversation: (conversationId) => {
      const socket = get().socket
      if (socket) {
          socket.emit('join', { conversationId })
      }
   },

   leaveConversation: (conversationId) => {
      const socket = get().socket
      if (socket) {
          socket.emit('leave', { conversationId })
      }
   },
  
   connectSocket: () => {
     if (get().socket) return
     
      // Use the API URL from environment, removing /api suffix for socket connection
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const socketUrl = apiUrl.replace('/api', '')
      const socket = io(socketUrl)
     
     socket.on('connect', () => {
         console.log('Socket connected')
     })
     
     socket.on('new_message', (data: { conversationId: number, message: Message }) => {
         const { conversationId, message } = data
         set((s) => ({
             messagesByConversation: {
                 ...s.messagesByConversation,
                 [conversationId]: [...(s.messagesByConversation[conversationId] || []), message]
             }
         }))
         // Also define that we should update conversation list snippet?
         // For now, let's trigger a light fetchConversations to update the list order/snippet
         get().fetchConversations(true)
     })
     
     set({ socket })
   },

   disconnectSocket: () => {
     const socket = get().socket
     if (socket) {
         socket.disconnect()
         set({ socket: null })
     }
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
      // We still use REST API to send, backend emits event back to us (and others)
      // Optimistic update is possible but let's rely on the socket event for consistency first
      await chatApi.sendMessage(conversationId, trimmed)
      // No need to manually append here if socket event handles it, 
      // BUT for latency smoothing we could?
      // actually, the 'new_message' event will come back and append it. 
      // If we append here AND there, we get duplicates unless we filter by ID.
      // Let's rely on socket event.
      
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
