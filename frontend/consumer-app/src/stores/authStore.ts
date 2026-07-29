import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  name: string
  role: string
  avatar: string
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,

      login: async () => {
        return { success: false, error: 'Login not available through this store' }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        set({ isAuthenticated: false, token: null, user: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
