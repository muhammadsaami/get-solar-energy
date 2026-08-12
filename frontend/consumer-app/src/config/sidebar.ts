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
  badge?: number
}

export interface SidebarGroupConfig {
  groupName: string
  items: SidebarItemConfig[]
}

export const SIDEBAR_ITEMS: SidebarGroupConfig[] = [
  {
    groupName: 'Solar Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', route: ROUTES.HOME, color: 'blue', symbolId: 'home', visible: true, requiredFeature: 'dashboard' },
      { id: 'bill-analyzer', label: 'Bill Analyzer', route: ROUTES.BILL_ANALYZER, color: 'cyan', symbolId: 'bill', visible: true, requiredFeature: 'bill-analyzer' },
      { id: 'roof-analysis', label: 'Roof Analysis', route: ROUTES.ROOF_ANALYSIS, color: 'orange', symbolId: 'roof', visible: true, requiredFeature: 'roof-analysis' },
      { id: 'roi-calculator', label: 'ROI Calculator', route: ROUTES.ROI_CALCULATOR, color: 'green', symbolId: 'calculator', visible: true, requiredFeature: 'roi-calculator' },
      { id: 'proposal', label: 'AI Proposal', route: ROUTES.PLANNING_PROPOSAL, color: 'orange', symbolId: 'reports', visible: true, requiredFeature: 'proposal-generator' },
    ],
  },
  {
    groupName: 'Solar AI Intelligence',
    items: [
      { id: 'ai-assistant', label: 'AI Assistant', route: ROUTES.AI_ADVISOR, color: 'purple', symbolId: 'sparkles', visible: true, requiredFeature: 'ai-assistant' },
      { id: 'enterprise-ai', label: 'Enterprise AI', route: ROUTES.ENTERPRISE_AI, color: 'indigo', symbolId: 'bot', visible: true, requiredFeature: 'enterprise-ai' },
    ],
  },
  {
    groupName: 'Ownership & Value',
    items: [
      { id: 'rewards', label: 'Rewards & Referrals', route: ROUTES.REWARDS, color: 'pink', symbolId: 'gift', visible: true, requiredFeature: 'rewards' },
      { id: 'system-performance', label: 'System Performance', route: ROUTES.SYSTEM_PERFORMANCE, color: 'sky', symbolId: 'system-performance', visible: true, requiredFeature: 'system-performance' },
      { id: 'amc', label: 'AMC Portal', route: ROUTES.AMC, color: 'teal', symbolId: 'shield', visible: true, requiredFeature: 'amc' },
      { id: 'documents', label: 'Documents', route: ROUTES.OWNERSHIP_DOCS, color: 'teal', symbolId: 'file-text', visible: true, requiredFeature: 'reports-center' },
      { id: 'notifications', label: 'Notifications', route: ROUTES.ACTIVITY_CENTER, color: 'sky', symbolId: 'activity', visible: true, requiredFeature: 'activity-center' },
      { id: 'support', label: 'Support', route: ROUTES.SUPPORT_HELP, color: 'lime', symbolId: 'help-circle', visible: true, requiredFeature: 'activity-center' },
    ],
  },
  {
    groupName: 'Account',
    items: [
      { id: 'profile', label: 'Profile', route: ROUTES.ACCOUNT_PROFILE, color: 'gray', symbolId: 'user', visible: true, requiredFeature: 'account-profile' },
      { id: 'settings', label: 'Settings', route: ROUTES.ACCOUNT_SETTINGS, color: 'gray', symbolId: 'settings', visible: true, requiredFeature: 'settings' },
    ],
  },
]
