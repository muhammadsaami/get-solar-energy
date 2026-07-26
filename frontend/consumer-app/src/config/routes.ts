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
  REWARDS: '/app/support/referrals',

  // Vendor
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

  // Catch-all
  NOT_FOUND: '*',
} as const
