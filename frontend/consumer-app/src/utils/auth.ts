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
  const canonicalRole = normalizeRole((source.role as string) || (raw.role as string))

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
