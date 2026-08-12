import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { ROUTES } from '../config/routes'
import type { FeatureId } from '../config/permissions'
import AccessDenied from '../components/auth/AccessDenied'

interface PermissionGuardProps {
  children: React.ReactNode
  feature: FeatureId
  requireAuth?: boolean
}

export default function PermissionGuard({ children, feature, requireAuth = true }: PermissionGuardProps) {
  const auth = useAuth() as unknown as { isAuthenticated: boolean; loading: boolean }
  const { canAccess } = usePermissions()

  if (auth.loading) {
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

  if (requireAuth && !auth.isAuthenticated) {
    const isVendorPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/app/vendor')
    const redirectUrl = isVendorPath ? `${ROUTES.LOGIN}?role=vendor` : ROUTES.LOGIN
    return <Navigate to={redirectUrl} replace />
  }

  if (!canAccess(feature)) {
    return <AccessDenied />
  }

  return <>{children}</>
}
