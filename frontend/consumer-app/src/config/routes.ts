export const ROUTES = {
  // Public
  LANDING: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RESET_PASSWORD: '/reset-password',

  // Authenticated
  HOME: '/app/home',
  JOURNEY: '/app/journey',

  // Planning
  PLANNING_PROPOSAL: '/app/planning/proposal',

  // Installation (Locked placeholders)
  INSTALLATION_PROGRESS: '/app/installation/progress',
  INSTALLATION_QA: '/app/installation/qa',
  INSTALLATION_GRID: '/app/installation/grid',

  // Ownership (Locked placeholders)
  OWNERSHIP_SYSTEM: '/app/ownership/system',
  OWNERSHIP_SAVINGS: '/app/ownership/savings',
  OWNERSHIP_REPORTS: '/app/ownership/reports',
  OWNERSHIP_DOCS: '/app/ownership/docs',

  // Support
  ACTIVITY_CENTER: '/app/activity-center',
  SUPPORT_NOTIFICATIONS: '/app/support/notifications',
  SUPPORT_HELP: '/app/support/help',
  SUPPORT_REFERRALS: '/app/support/referrals',

  // Account (Locked placeholders)
  ACCOUNT_PROFILE: '/app/account/profile',
  ACCOUNT_SETTINGS: '/app/account/settings',

  // Migration tabs (canonical)
  BILL_ANALYZER: '/app/bill-analyzer',
  ROI_CALCULATOR: '/app/roi-calculator',
  ROOF_ANALYSIS: '/app/roof-analysis',
  AI_ADVISOR: '/app/ai-advisor',
  ENTERPRISE_AI: '/app/enterprise-ai',
  KNOWLEDGE_BASE: '/app/knowledge-base',
  REWARDS: '/app/support/referrals',

  // Vendor Portal
  VENDOR_DASHBOARD: '/app/vendor',
  VENDOR_MY_WORK: '/app/vendor/my-work',
  VENDOR_TASKS: '/app/vendor/my-work/tasks',
  VENDOR_VISITS: '/app/vendor/my-work/visits',
  VENDOR_INSTALLATIONS: '/app/vendor/my-work/installations',
  VENDOR_WORK_ORDERS: '/app/vendor/my-work/orders',
  VENDOR_PROJECTS_ACTIVE: '/app/vendor/projects/active',
  VENDOR_PROJECTS_COMPLETED: '/app/vendor/projects/completed',
  VENDOR_CUSTOMERS: '/app/vendor/customers',
  VENDOR_AMC: '/app/vendor/amc',
  VENDOR_REPORTS: '/app/vendor/reports',
  VENDOR_PROJECT_TRACKING: '/app/vendor/project-tracking',

  // Locked placeholders (full sidebar parity)
  SYSTEM_PERFORMANCE: '/app/system-performance',
  AMC: '/app/amc',
  SITE_SURVEY: '/app/site-survey',
  ADMIN_DASHBOARD: '/app/admin/dashboard',
  CRM_LEADS: '/app/crm/leads',
  AUDIT_MONITORING: '/app/audit/monitoring',
  BUSINESS_INTELLIGENCE: '/app/business-intelligence',
  MLOPS: '/app/mlops',

  // Technician Network
  TECHNICIAN_DASHBOARD: '/app/technician/dashboard',
  TECHNICIAN_TRAINING: '/app/technician/training',
  TECHNICIAN_CERTIFICATIONS: '/app/technician/certifications',
  TECHNICIAN_MARKETPLACE: '/app/technician/marketplace',
  TECHNICIAN_WORK_ORDERS: '/app/technician/work-orders',
  TECHNICIAN_EARNINGS: '/app/technician/earnings',
  TECHNICIAN_PROFILE: '/app/technician/profile',
  TECHNICIAN_AI: '/app/technician/ai-troubleshooting',

  // Catch-all
  NOT_FOUND: '*',
} as const

import { ROLES, type Role } from './roles'

export const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  [ROLES.CUSTOMER]: '/app/home',
  [ROLES.VENDOR]: '/app/vendor',
  [ROLES.ENGINEER]: '/app/vendor',
  [ROLES.ADMIN]: '/app/admin/dashboard',
  [ROLES.TECHNICIAN]: '/app/technician/dashboard',
}
