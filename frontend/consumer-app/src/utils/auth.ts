import { normalizeRole, getDisplayRole } from './role'
import type { Role } from '../config/roles'

export interface AuthenticatedUser {
  id: number | string
  email: string
  name: string
  role: Role
  displayRole: string
  avatar: string
  phone: string
  city: string
  subscriptionTier: string
}

export function normalizeAuthenticatedUser(raw: Record<string, unknown>): AuthenticatedUser {
  const source = (raw.user as Record<string, unknown> | undefined) || (raw.technician as Record<string, unknown> | undefined) || raw

  // Explicit top-level role (set by AuthContext as a deliberate override) takes
  // precedence over the nested user/technician object's role field.
  // This is the correct priority because:
  //   1. The backend now validates the role and returns it at the top level.
  //   2. AuthContext.persistSession may set role: roleHint at the top level
  //      when the nested user object carries a legacy/mismatched value.
  const explicitRole = raw.role as string | undefined
  const sourceRole   = source.role as string | undefined
  const canonicalRole = normalizeRole(explicitRole || sourceRole)

  return {
    id: (source.id as number | string) ?? '',
    email: (source.email as string) || '',
    name: (source.name as string) || '',
    role: canonicalRole,
    displayRole: getDisplayRole(canonicalRole),
    phone: (source.phone as string) || '',
    city: (source.city as string) || '',
    avatar: (source.avatar as string) || '',
    subscriptionTier: (source.subscriptionTier as string) || (source.subscription_tier as string) || getDisplayRole(canonicalRole),
  }
}

