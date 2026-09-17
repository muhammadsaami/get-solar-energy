import { ROLES, type Role } from '../config/roles'
import { DEFAULT_ROUTE_BY_ROLE } from '../config/routes'

const ROLE_DISPLAY: Record<string, string> = {
  [ROLES.CUSTOMER]: 'Standard User',
  [ROLES.VENDOR]: 'Vendor',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.ENGINEER]: 'Field Engineer',
  [ROLES.TECHNICIAN]: 'Technician',
}

const LEGACY_ROLE_MAP: Record<string, Role> = {
  'Administrator': ROLES.ADMIN,
  'Premium User': ROLES.CUSTOMER,
  'Free User': ROLES.CUSTOMER,
  'Standard User': ROLES.CUSTOMER,
  'customer': ROLES.CUSTOMER,
  'vendor': ROLES.VENDOR,
  'admin': ROLES.ADMIN,
  'engineer': ROLES.ENGINEER,
  'technician': ROLES.TECHNICIAN,
}

export function normalizeRole(rawRole: unknown): Role {
  if (!rawRole || typeof rawRole !== 'string') {
    console.error(
      `[AuthContract] Missing or invalid role in authentication response. ` +
      `Expected a canonical role string, got ${typeof rawRole} "${String(rawRole)}". ` +
      `The backend must always provide a valid role field. ` +
      `Defaulting to '${ROLES.CUSTOMER}' as a safety fallback.`
    )
    return ROLES.CUSTOMER
  }
  const canonical = LEGACY_ROLE_MAP[rawRole]
  if (!canonical) {
    console.warn(
      `[AuthContract] Unknown role "${rawRole}" received from backend. ` +
      `Expected one of: ${Object.keys(LEGACY_ROLE_MAP).join(', ')}. ` +
      `Defaulting to '${ROLES.CUSTOMER}'.`
    )
  }
  return canonical ?? ROLES.CUSTOMER
}

export function getDisplayRole(role?: Role | string | null): string {
  if (!role) return 'Standard User'
  return ROLE_DISPLAY[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

export function getDefaultRoute(role: Role): string {
  return DEFAULT_ROUTE_BY_ROLE[role] || '/app/home'
}
