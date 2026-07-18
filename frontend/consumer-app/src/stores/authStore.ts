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

      login: async (email, password) => {
        if (email && password) {
          const mockToken = 'mock_jwt_access_token_value_xyz'
          const mockUser: User = {
            id: 1,
            email,
            name: email.split('@')[0].toUpperCase(),
            role: 'customer',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GETSolar',
          }

          localStorage.setItem('access_token', mockToken)
          localStorage.setItem('user', JSON.stringify(mockUser))

          set({ isAuthenticated: true, token: mockToken, user: mockUser })
          return { success: true }
        }
        return { success: false, error: 'Invalid username or password' }
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
