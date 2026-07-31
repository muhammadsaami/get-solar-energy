import { ROUTES } from './routes'

export interface FeatureMetadata {
  title: string
  stageId: string
  icon?: string
}

export const FEATURE_METADATA: Record<string, FeatureMetadata> = {
  // Installation
  [ROUTES.INSTALLATION_PROGRESS]: { title: 'Installation Progress', stageId: 'ST-08', icon: 'truck' },
  [ROUTES.INSTALLATION_QA]: { title: 'QA Inspection', stageId: 'ST-10', icon: 'shield' },
  [ROUTES.INSTALLATION_GRID]: { title: 'Net Metering & Grid', stageId: 'ST-11', icon: 'grid' },

  // Ownership
  [ROUTES.OWNERSHIP_SYSTEM]: { title: 'System Monitoring', stageId: 'ST-12', icon: 'activity' },
  [ROUTES.OWNERSHIP_SAVINGS]: { title: 'Savings Dashboard', stageId: 'ST-12', icon: 'trending' },
  [ROUTES.OWNERSHIP_DOCS]: { title: 'Docs & Warranty', stageId: 'ST-12', icon: 'file' },

  // Support
  [ROUTES.SUPPORT_HELP]: { title: 'Help & Support', stageId: 'ST-02', icon: 'help' },

  // Account
  [ROUTES.ACCOUNT_PROFILE]: { title: 'Profile', stageId: 'ST-02', icon: 'user' },

  // Sidebar parity — visible locked features
  [ROUTES.SITE_SURVEY]: { title: 'Site Survey', stageId: 'ST-07', icon: 'clipboard' },

  // Sidebar parity — hidden platform features
  [ROUTES.ADMIN_DASHBOARD]: { title: 'Admin Dashboard', stageId: 'ST-02', icon: 'crown' },
  [ROUTES.CRM_LEADS]: { title: 'CRM & Leads', stageId: 'ST-02', icon: 'users' },
  [ROUTES.AUDIT_MONITORING]: { title: 'Audit & Monitoring', stageId: 'ST-12', icon: 'activity' },
  [ROUTES.BUSINESS_INTELLIGENCE]: { title: 'Business Intelligence', stageId: 'ST-12', icon: 'trending' },
  [ROUTES.MLOPS]: { title: 'MLOps', stageId: 'ST-12', icon: 'mlops' },

  // Technician Network
  [ROUTES.TECHNICIAN_DASHBOARD]: { title: 'Technician Dashboard', stageId: 'PHASE_18_3', icon: 'dashboard' },
  [ROUTES.TECHNICIAN_TRAINING]: { title: 'Training Academy', stageId: 'PHASE_18_4', icon: 'book' },
  [ROUTES.TECHNICIAN_CERTIFICATIONS]: { title: 'Certifications', stageId: 'PHASE_18_5', icon: 'badge' },
  [ROUTES.TECHNICIAN_MARKETPLACE]: { title: 'Job Marketplace', stageId: 'PHASE_18_6', icon: 'briefcase' },
  [ROUTES.TECHNICIAN_WORK_ORDERS]: { title: 'Work Orders', stageId: 'PHASE_18_7', icon: 'clipboard' },
  [ROUTES.TECHNICIAN_EARNINGS]: { title: 'Earnings', stageId: 'PHASE_18_8', icon: 'currency' },
  [ROUTES.TECHNICIAN_PROFILE]: { title: 'Profile & Performance', stageId: 'PHASE_18_9', icon: 'user' },
  [ROUTES.TECHNICIAN_AI]: { title: 'AI Troubleshooting', stageId: 'PHASE_18_10', icon: 'sparkles' },
} as const
