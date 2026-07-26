import { ROUTES } from './routes'

export interface SidebarItemConfig {
  id: string
  label: string
  route: string
  color: string
  symbolId: string
  visible: boolean
}

export interface SidebarGroupConfig {
  groupName: string
  items: SidebarItemConfig[]
}

export const SIDEBAR_ITEMS: SidebarGroupConfig[] = [
  {
    groupName: 'Customer Tools',
    items: [
      { id: 'dashboard', label: 'Dashboard', route: ROUTES.HOME, color: 'blue', symbolId: 'home', visible: true },
      { id: 'bill-analyzer', label: 'Bill Analyzer', route: ROUTES.BILL_ANALYZER, color: 'cyan', symbolId: 'bill', visible: true },
      { id: 'roof-analysis', label: 'Roof Analysis', route: ROUTES.ROOF_ANALYSIS, color: 'orange', symbolId: 'roof', visible: true },
      { id: 'roi-calculator', label: 'ROI Calculator', route: ROUTES.ROI_CALCULATOR, color: 'green', symbolId: 'calculator', visible: true },
      { id: 'ai-assistant', label: 'AI Assistant', route: ROUTES.AI_ADVISOR, color: 'purple', symbolId: 'sparkles', visible: true },
      { id: 'enterprise-ai', label: 'Enterprise AI', route: ROUTES.ENTERPRISE_AI, color: 'indigo', symbolId: 'bot', visible: true },
    ],
  },
  {
    groupName: 'Engagement',
    items: [
      { id: 'rewards', label: 'Rewards & Referrals', route: ROUTES.REWARDS, color: 'pink', symbolId: 'gift', visible: true },
      { id: 'activity-center', label: 'Activity Center', route: ROUTES.ACTIVITY_CENTER, color: 'sky', symbolId: 'activity', visible: true },
      { id: 'performance', label: 'System Performance', route: ROUTES.SYSTEM_PERFORMANCE, color: 'lime', symbolId: 'server', visible: true },
    ],
  },
  {
    groupName: 'Reports',
    items: [
      { id: 'reports-center', label: 'Reports Center', route: ROUTES.OWNERSHIP_REPORTS, color: 'teal', symbolId: 'reports', visible: true },
    ],
  },
  {
    groupName: 'Maintenance',
    items: [
      { id: 'amc', label: 'AMC', route: ROUTES.AMC, color: 'blue', symbolId: 'wrench', visible: true },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      { id: 'site-survey', label: 'Site Survey', route: ROUTES.SITE_SURVEY, color: 'purple', symbolId: 'clipboard', visible: true },
    ],
  },
  {
    groupName: 'Platform',
    items: [
      { id: 'settings', label: 'Settings', route: ROUTES.ACCOUNT_SETTINGS, color: 'gray', symbolId: 'settings', visible: true },
      { id: 'vendor-portal', label: 'Vendor Portal', route: ROUTES.VENDOR_PROJECT_TRACKING, color: 'amber', symbolId: 'briefcase', visible: true },
    ],
  },
  {
    groupName: 'Administration',
    items: [
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: ROUTES.ADMIN_DASHBOARD, color: 'gold', symbolId: 'crown', visible: true },
      { id: 'crm-dashboard', label: 'CRM & Leads', route: ROUTES.CRM_LEADS, color: 'indigo', symbolId: 'users', visible: true },
    ],
  },
  {
    groupName: 'Analytics',
    items: [
      { id: 'business-intelligence', label: 'Business Intelligence', route: ROUTES.BUSINESS_INTELLIGENCE, color: 'emerald', symbolId: 'trending', visible: true },
      { id: 'audit-monitoring', label: 'Audit & Monitoring', route: ROUTES.AUDIT_MONITORING, color: 'red', symbolId: 'activity', visible: true },
    ],
  },
  {
    groupName: 'AI / ML',
    items: [
      { id: 'mlops-dashboard', label: 'MLOps', route: ROUTES.MLOPS, color: 'red', symbolId: 'mlops', visible: true },
    ],
  },
]
