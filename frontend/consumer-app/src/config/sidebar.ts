import { ROUTES } from './routes'
import type { FeatureId } from './permissions'

export interface SidebarItemConfig {
  id: string
  label: string
  route: string
  color: string
  symbolId: string
  visible: boolean
  requiredFeature?: FeatureId
}

export interface SidebarGroupConfig {
  groupName: string
  items: SidebarItemConfig[]
}

export const SIDEBAR_ITEMS: SidebarGroupConfig[] = [
  {
    groupName: 'Customer Tools',
    items: [
      { id: 'dashboard', label: 'Dashboard', route: ROUTES.HOME, color: 'blue', symbolId: 'home', visible: true, requiredFeature: 'dashboard' },
      { id: 'bill-analyzer', label: 'Bill Analyzer', route: ROUTES.BILL_ANALYZER, color: 'cyan', symbolId: 'bill', visible: true, requiredFeature: 'bill-analyzer' },
      { id: 'roof-analysis', label: 'Roof Analysis', route: ROUTES.ROOF_ANALYSIS, color: 'orange', symbolId: 'roof', visible: true, requiredFeature: 'roof-analysis' },
      { id: 'roi-calculator', label: 'ROI Calculator', route: ROUTES.ROI_CALCULATOR, color: 'green', symbolId: 'calculator', visible: true, requiredFeature: 'roi-calculator' },
      { id: 'proposal', label: 'AI Proposal', route: ROUTES.PLANNING_PROPOSAL, color: 'orange', symbolId: 'reports', visible: true, requiredFeature: 'proposal-generator' },
      { id: 'ai-assistant', label: 'AI Assistant', route: ROUTES.AI_ADVISOR, color: 'purple', symbolId: 'sparkles', visible: true, requiredFeature: 'ai-assistant' },
      { id: 'enterprise-ai', label: 'Enterprise AI', route: ROUTES.ENTERPRISE_AI, color: 'indigo', symbolId: 'bot', visible: true, requiredFeature: 'enterprise-ai' },
    ],
  },
  {
    groupName: 'Engagement',
    items: [
      { id: 'rewards', label: 'Rewards & Referrals', route: ROUTES.REWARDS, color: 'pink', symbolId: 'gift', visible: true, requiredFeature: 'rewards' },
      { id: 'activity-center', label: 'Activity Center', route: ROUTES.ACTIVITY_CENTER, color: 'sky', symbolId: 'activity', visible: true, requiredFeature: 'activity-center' },
      { id: 'performance', label: 'System Performance', route: ROUTES.SYSTEM_PERFORMANCE, color: 'lime', symbolId: 'server', visible: true, requiredFeature: 'system-performance' },
    ],
  },
  {
    groupName: 'Reports',
    items: [
      { id: 'reports-center', label: 'Reports Center', route: ROUTES.OWNERSHIP_REPORTS, color: 'teal', symbolId: 'reports', visible: true, requiredFeature: 'reports-center' },
    ],
  },
  {
    groupName: 'Maintenance',
    items: [
      { id: 'amc', label: 'AMC', route: ROUTES.AMC, color: 'blue', symbolId: 'wrench', visible: true, requiredFeature: 'amc' },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      { id: 'site-survey', label: 'Site Survey', route: ROUTES.SITE_SURVEY, color: 'purple', symbolId: 'clipboard', visible: true, requiredFeature: 'site-survey' },
    ],
  },
  {
    groupName: 'Platform',
    items: [
      { id: 'settings', label: 'Settings', route: ROUTES.ACCOUNT_SETTINGS, color: 'gray', symbolId: 'settings', visible: true, requiredFeature: 'settings' },
    ],
  },
  {
    groupName: 'Vendor Portal',
    items: [
      { id: 'v-dashboard', label: 'Dashboard', route: ROUTES.VENDOR_DASHBOARD, color: 'amber', symbolId: 'home', visible: true, requiredFeature: 'vendor-dashboard' },
      { id: 'v-my-work', label: 'My Work', route: ROUTES.VENDOR_MY_WORK, color: 'amber', symbolId: 'briefcase', visible: true, requiredFeature: 'vendor-portal' },
      { id: 'v-projects', label: 'Projects', route: ROUTES.VENDOR_PROJECTS_ACTIVE, color: 'amber', symbolId: 'folder', visible: true, requiredFeature: 'vendor-projects' },
      { id: 'v-customers', label: 'Customers', route: ROUTES.VENDOR_CUSTOMERS, color: 'amber', symbolId: 'users', visible: true, requiredFeature: 'vendor-customers' },
      { id: 'v-amc', label: 'AMC', route: ROUTES.VENDOR_AMC, color: 'blue', symbolId: 'wrench', visible: true, requiredFeature: 'amc' },
      { id: 'v-reports', label: 'Reports', route: ROUTES.VENDOR_REPORTS, color: 'amber', symbolId: 'reports', visible: true, requiredFeature: 'vendor-reports' },
    ],
  },
  {
    groupName: 'Administration',
    items: [
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: ROUTES.ADMIN_DASHBOARD, color: 'gold', symbolId: 'crown', visible: true, requiredFeature: 'admin-dashboard' },
      { id: 'crm-dashboard', label: 'CRM & Leads', route: ROUTES.CRM_LEADS, color: 'indigo', symbolId: 'users', visible: true, requiredFeature: 'crm-dashboard' },
    ],
  },
  {
    groupName: 'Analytics',
    items: [
      { id: 'business-intelligence', label: 'Business Intelligence', route: ROUTES.BUSINESS_INTELLIGENCE, color: 'emerald', symbolId: 'trending', visible: true, requiredFeature: 'business-intelligence' },
      { id: 'audit-monitoring', label: 'Audit & Monitoring', route: ROUTES.AUDIT_MONITORING, color: 'red', symbolId: 'activity', visible: true, requiredFeature: 'audit-monitoring' },
    ],
  },
  {
    groupName: 'AI / ML',
    items: [
      { id: 'mlops-dashboard', label: 'MLOps', route: ROUTES.MLOPS, color: 'red', symbolId: 'mlops', visible: true, requiredFeature: 'mlops-dashboard' },
    ],
  },
]
