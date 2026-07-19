export interface SidebarItemConfig {
  id: string
  label: string
  route: string
  color: string
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
      { id: 'dashboard', label: 'Dashboard', route: '/app/home', color: 'blue', visible: true },
      { id: 'bill-analyzer', label: 'Bill Analyzer', route: '/app/planning/bills', color: 'cyan', visible: true },
      { id: 'roof-analysis', label: 'Roof Analysis', route: '/app/planning/roof', color: 'orange', visible: true },
      { id: 'roi-calculator', label: 'ROI Calculator', route: '#', color: 'green', visible: true },
      { id: 'ai-assistant', label: 'AI Assistant', route: '#', color: 'purple', visible: true },
      { id: 'enterprise-ai', label: 'Enterprise AI', route: '#', color: 'indigo', visible: true },
    ],
  },
  {
    groupName: 'Engagement',
    items: [
      { id: 'rewards', label: 'Rewards & Referrals', route: '/app/support/referrals', color: 'pink', visible: true },
      { id: 'reports-center', label: 'Reports Center', route: '/app/ownership/reports', color: 'teal', visible: true },
      { id: 'activity-center', label: 'Activity Center', route: '/app/support/notifications', color: 'sky', visible: true },
      { id: 'performance', label: 'System Performance', route: '#', color: 'lime', visible: true },
    ],
  },
  {
    groupName: 'Maintenance',
    items: [
      { id: 'amc', label: 'AMC', route: '#', color: 'blue', visible: true },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      { id: 'site-survey', label: 'Site Survey', route: '#', color: 'purple', visible: true },
    ],
  },
  {
    groupName: 'Platform',
    items: [
      { id: 'settings', label: 'Settings', route: '/app/account/settings', color: 'gray', visible: true },
      { id: 'vendor-portal', label: 'Vendor Portal', route: '/app/vendor/project-tracking', color: 'amber', visible: true },
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: '#', color: 'gold', visible: false },
      { id: 'crm-dashboard', label: 'CRM & Leads', route: '#', color: 'indigo', visible: false },
      { id: 'audit-monitoring', label: 'Audit & Monitoring', route: '#', color: 'red', visible: false },
      { id: 'business-intelligence', label: 'Business Intelligence', route: '#', color: 'emerald', visible: false },
      { id: 'mlops-dashboard', label: 'MLOps', route: '#', color: 'red', visible: false },
    ],
  },
]
