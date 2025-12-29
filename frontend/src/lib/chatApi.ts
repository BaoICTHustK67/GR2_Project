import api from './api'
import type { Conversation, Message } from '@/types/chat'

export const chatApi = {
  async listConversations(): Promise<{ conversations: Conversation[] }> {
    const res = await api.get('/conversations')
    return res.data
  },

  async createConversation(participantIds: number[]): Promise<{ conversation: Conversation; isNew: boolean }> {
    const res = await api.post('/conversations', { participantIds })
    return res.data
  },

  async getConversation(conversationId: number): Promise<{
    conversation: Conversation
    messages: { items: Message[]; page: number; per_page: number; total: number; pages: number }
  }> {
    const res = await api.get(`/conversations/${conversationId}`)
    return res.data
  },

  async sendMessage(conversationId: number, content: string): Promise<{ message: Message }> {
    const res = await api.post(`/conversations/${conversationId}/messages`, { content })
    return res.data
  },
}

