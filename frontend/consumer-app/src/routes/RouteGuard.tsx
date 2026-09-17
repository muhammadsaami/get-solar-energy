import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../config/routes'

interface AuthLike {
  isAuthenticated: boolean
  loading: boolean
}

interface RouteGuardProps {
  children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const auth = useAuth() as unknown as AuthLike
  const { isAuthenticated, loading } = auth ?? { isAuthenticated: false, loading: true }

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
          fontSize: '14px',
        }}
      >
        Loading Session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}
