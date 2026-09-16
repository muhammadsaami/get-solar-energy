import { useAuth } from '../contexts/AuthContext'

export function useAuthStatus() {
  const { isAuthenticated, user, loading } = useAuth() as unknown as {
    isAuthenticated: boolean
    user: { id: number | string; email: string; name: string; role: string } | null
    loading: boolean
  }
  return { isAuthenticated, user, loading }
}
