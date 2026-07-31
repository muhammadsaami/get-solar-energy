import { ROLES, type Role } from './roles'

export type FeatureId =
  | 'dashboard'
  | 'bill-analyzer'
  | 'roof-analysis'
  | 'roi-calculator'
  | 'ai-assistant'
  | 'enterprise-ai'
  | 'knowledge-base'
  | 'rewards'
  | 'activity-center'
  | 'system-performance'
  | 'reports-center'
  | 'amc'
  | 'site-survey'
  | 'settings'
  | 'settings-admin'
  | 'vendor-portal'
  | 'vendor-dashboard'
  | 'vendor-projects'
  | 'vendor-customers'
  | 'vendor-reports'
  | 'proposal-generator'
  | 'admin-dashboard'
  | 'crm-dashboard'
  | 'business-intelligence'
  | 'audit-monitoring'
  | 'mlops-dashboard'
  | 'technician-dashboard'
  | 'technician-training'
  | 'technician-certifications'
  | 'technician-marketplace'
  | 'technician-work-orders'
  | 'technician-earnings'
  | 'technician-profile'
  | 'technician-ai'

interface FeaturePermission {
  roles: Role[]
}

export const FEATURE_PERMISSIONS: Record<FeatureId, FeaturePermission> = {
  dashboard: { roles: [ROLES.CUSTOMER, ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'bill-analyzer': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'roof-analysis': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'roi-calculator': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'ai-assistant': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'enterprise-ai': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'knowledge-base': { roles: [ROLES.CUSTOMER, ROLES.VENDOR, ROLES.ENGINEER, ROLES.ADMIN, ROLES.TECHNICIAN] },
  rewards: { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'activity-center': { roles: [ROLES.CUSTOMER, ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'system-performance': { roles: [ROLES.CUSTOMER, ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'reports-center': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  amc: { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  'site-survey': { roles: [ROLES.VENDOR, ROLES.ADMIN] },
  'proposal-generator': { roles: [ROLES.CUSTOMER, ROLES.ADMIN] },
  settings: { roles: [ROLES.CUSTOMER, ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'settings-admin': { roles: [ROLES.ADMIN] },
  'vendor-portal': { roles: [ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'vendor-dashboard': { roles: [ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'vendor-projects': { roles: [ROLES.VENDOR, ROLES.ADMIN, ROLES.ENGINEER] },
  'vendor-customers': { roles: [ROLES.VENDOR, ROLES.ADMIN] },
  'vendor-reports': { roles: [ROLES.VENDOR, ROLES.ADMIN] },
  'admin-dashboard': { roles: [ROLES.ADMIN] },
  'crm-dashboard': { roles: [ROLES.ADMIN] },
  'business-intelligence': { roles: [ROLES.ADMIN] },
  'audit-monitoring': { roles: [ROLES.ADMIN] },
  'mlops-dashboard': { roles: [ROLES.ADMIN] },
  'technician-dashboard': { roles: [ROLES.TECHNICIAN] },
  'technician-training': { roles: [ROLES.TECHNICIAN] },
  'technician-certifications': { roles: [ROLES.TECHNICIAN] },
  'technician-marketplace': { roles: [ROLES.TECHNICIAN] },
  'technician-work-orders': { roles: [ROLES.TECHNICIAN] },
  'technician-earnings': { roles: [ROLES.TECHNICIAN] },
  'technician-profile': { roles: [ROLES.TECHNICIAN] },
  'technician-ai': { roles: [ROLES.TECHNICIAN] },
}

export const SETTINGS_SECTIONS: Record<string, FeatureId> = {
  profile: 'settings',
  'solar-preferences': 'settings',
  'admin-config': 'settings-admin',
}
