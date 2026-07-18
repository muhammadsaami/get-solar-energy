import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../config/routes'

interface AuthLike {
  isAuthenticated: boolean
  user: { role: string } | null
  loading: boolean
}

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const auth = useAuth() as unknown as AuthLike
  const { isAuthenticated, user, loading } = auth ?? { isAuthenticated: false, user: null, loading: true }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-deep-blue)',
          color: 'var(--text-secondary)',
        }}
      >
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return <>{children}</>
}
