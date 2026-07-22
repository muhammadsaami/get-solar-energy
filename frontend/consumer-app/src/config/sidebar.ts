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
      { id: 'dashboard', label: 'Dashboard', route: '/app/home', color: 'blue', symbolId: 'home', visible: true },
      { id: 'bill-analyzer', label: 'Bill Analyzer', route: '/app/planning/bills', color: 'cyan', symbolId: 'bill', visible: true },
      { id: 'roof-analysis', label: 'Roof Analysis', route: '/app/planning/roof', color: 'orange', symbolId: 'roof', visible: true },
      { id: 'roi-calculator', label: 'ROI Calculator', route: '#', color: 'green', symbolId: 'calculator', visible: true },
      { id: 'ai-assistant', label: 'AI Assistant', route: '#', color: 'purple', symbolId: 'sparkles', visible: true },
      { id: 'enterprise-ai', label: 'Enterprise AI', route: '#', color: 'indigo', symbolId: 'bot', visible: true },
    ],
  },
  {
    groupName: 'Engagement',
    items: [
      { id: 'rewards', label: 'Rewards & Referrals', route: '/app/support/referrals', color: 'pink', symbolId: 'gift', visible: true },
      { id: 'reports-center', label: 'Reports Center', route: '/app/ownership/reports', color: 'teal', symbolId: 'reports', visible: true },
      { id: 'activity-center', label: 'Activity Center', route: '/app/support/notifications', color: 'sky', symbolId: 'activity', visible: true },
      { id: 'performance', label: 'System Performance', route: '#', color: 'lime', symbolId: 'server', visible: true },
    ],
  },
  {
    groupName: 'Maintenance',
    items: [
      { id: 'amc', label: 'AMC', route: '#', color: 'blue', symbolId: 'wrench', visible: true },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      { id: 'site-survey', label: 'Site Survey', route: '#', color: 'purple', symbolId: 'clipboard', visible: true },
    ],
  },
  {
    groupName: 'Platform',
    items: [
      { id: 'settings', label: 'Settings', route: '/app/account/settings', color: 'gray', symbolId: 'settings', visible: true },
      { id: 'vendor-portal', label: 'Vendor Portal', route: '/app/vendor/project-tracking', color: 'amber', symbolId: 'briefcase', visible: true },
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: '#', color: 'gold', symbolId: 'crown', visible: false },
      { id: 'crm-dashboard', label: 'CRM & Leads', route: '#', color: 'indigo', symbolId: 'users', visible: false },
      { id: 'audit-monitoring', label: 'Audit & Monitoring', route: '#', color: 'red', symbolId: 'activity', visible: false },
      { id: 'business-intelligence', label: 'Business Intelligence', route: '#', color: 'emerald', symbolId: 'trending', visible: false },
      { id: 'mlops-dashboard', label: 'MLOps', route: '#', color: 'red', symbolId: 'mlops', visible: false },
    ],
  },
]
