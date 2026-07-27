import { useAuth } from '../contexts/AuthContext'
import { FEATURE_PERMISSIONS, type FeatureId } from '../config/permissions'
import { type Role } from '../config/roles'

interface AuthUser {
  role?: string
}

export function usePermissions() {
  const auth = useAuth() as unknown as { user: AuthUser | null }
  const userRole = auth?.user?.role as Role | undefined

  function hasRole(role: Role): boolean {
    return userRole === role
  }

  function hasAnyRole(roles: Role[]): boolean {
    return roles.includes(userRole as Role)
  }

  function canAccess(feature: FeatureId): boolean {
    const permission = FEATURE_PERMISSIONS[feature]
    if (!permission) return false
    return permission.roles.includes(userRole as Role)
  }

  return {
    role: userRole,
    hasRole,
    hasAnyRole,
    canAccess,
  }
}
