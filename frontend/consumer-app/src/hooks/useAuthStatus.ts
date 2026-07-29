import { useAuthStore } from '../stores/authStore'

export function useAuthStatus() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  return { isAuthenticated, user }
}
