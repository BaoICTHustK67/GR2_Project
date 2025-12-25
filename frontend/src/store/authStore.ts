import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, token) => {
        console.log('Setting auth - user:', user?.email, 'token:', token?.substring(0, 20) + '...')
        set({ user, token, isAuthenticated: true })
      },
      setUser: (user) => {
        console.log('Setting user:', user?.email)
        set({ user })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        console.log('Logging out')
        set({ user: null, token: null, isAuthenticated: false })
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('Rehydrated auth store:', state?.isAuthenticated, 'token exists:', !!state?.token)
        state?.setHasHydrated(true)
      },
    }
  )
)
