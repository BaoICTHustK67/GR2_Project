import api from './api'
import type { User } from '@/types'

export const connectionsApi = {
  async listConnections(): Promise<{ connections: User[] }> {
    const res = await api.get('/connections')
    return res.data
  },

  async listRequests(): Promise<{ requests: User[] }> {
    const res = await api.get('/connections/requests')
    return res.data
  },

  async sendRequest(userId: number): Promise<{ message: string }> {
    const res = await api.post(`/connections/${userId}`)
    return res.data
  },

  async respond(userId: number, action: 'accept' | 'reject'): Promise<{ message: string }> {
    const res = await api.put(`/connections/${userId}`, { action })
    return res.data
  },

  async remove(userId: number): Promise<{ message: string }> {
    const res = await api.delete(`/connections/${userId}`)
    return res.data
  },
}

