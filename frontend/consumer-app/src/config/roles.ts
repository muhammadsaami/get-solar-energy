export const ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  ENGINEER: 'engineer',
  TECHNICIAN: 'technician',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.CUSTOMER]: 0,
  [ROLES.ENGINEER]: 1,
  [ROLES.VENDOR]: 2,
  [ROLES.TECHNICIAN]: 3,
  [ROLES.ADMIN]: 10,
}

export function roleGte(role: Role, min: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[min]
}
