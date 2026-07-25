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
  PLANNING_BILLS: '/app/planning/bills',
  PLANNING_ROOF: '/app/planning/roof',
  PLANNING_PROPOSAL: '/app/planning/proposal',

  // Installation
  INSTALLATION_PROGRESS: '/app/installation/progress',
  INSTALLATION_QA: '/app/installation/qa',
  INSTALLATION_GRID: '/app/installation/grid',

  // Ownership
  OWNERSHIP_SYSTEM: '/app/ownership/system',
  OWNERSHIP_SAVINGS: '/app/ownership/savings',
  OWNERSHIP_REPORTS: '/app/ownership/reports',
  OWNERSHIP_DOCS: '/app/ownership/docs',

  // Support
  SUPPORT_NOTIFICATIONS: '/app/support/notifications',
  SUPPORT_HELP: '/app/support/help',
  SUPPORT_REFERRALS: '/app/support/referrals',

  // Account
  ACCOUNT_PROFILE: '/app/account/profile',
  ACCOUNT_SETTINGS: '/app/account/settings',

  // Migration tabs
  DASHBOARD: '/app/dashboard',
  BILL_ANALYZER: '/app/bill-analyzer',
  ROI_CALCULATOR: '/app/roi-calculator',
  ROOF_ANALYSIS: '/app/roof-analysis',
  AI_ADVISOR: '/app/ai-advisor',
  ENTERPRISE_AI: '/app/enterprise-ai',
  REWARDS: '/app/rewards',

  // Vendor
  VENDOR_PROJECT_TRACKING: '/app/vendor/project-tracking',

  // Admin
  ADMIN_DASHBOARD: '/app/admin/dashboard',
  ADMIN_AUDIT: '/app/admin/audit',
  ADMIN_BI: '/app/admin/bi',
  ADMIN_MLOPS: '/app/admin/mlops',

  // CRM
  CRM: '/app/crm',
  CRM_CUSTOMER: '/app/crm/customer/:id',

  // Operations
  OPERATIONS_AMC: '/app/operations/amc',
  OPERATIONS_SITE_SURVEY: '/app/operations/site-survey',

  // Catch-all
  NOT_FOUND: '*',
} as const
