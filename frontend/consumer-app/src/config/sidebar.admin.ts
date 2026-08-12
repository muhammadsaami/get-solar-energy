import { ROUTES } from './routes'
import type { SidebarGroupConfig } from './sidebar'

export const ADMIN_SIDEBAR_GROUPS: SidebarGroupConfig[] = [
  {
    groupName: 'Administration',
    items: [
      { id: 'admin-dashboard', label: 'Command Center', route: ROUTES.ADMIN_DASHBOARD, color: 'blue', symbolId: 'layout-dashboard', visible: true, requiredFeature: 'admin-dashboard' },
      { id: 'crm-dashboard', label: 'CRM & Customers', route: ROUTES.CRM_LEADS, color: 'purple', symbolId: 'users', visible: true, requiredFeature: 'crm-dashboard' },
      { id: 'business-intelligence', label: 'Business Intelligence', route: ROUTES.BUSINESS_INTELLIGENCE, color: 'green', symbolId: 'trending', visible: true, requiredFeature: 'business-intelligence' },
      { id: 'audit-monitoring', label: 'Audit & Monitoring', route: ROUTES.AUDIT_MONITORING, color: 'yellow', symbolId: 'shield', visible: true, requiredFeature: 'audit-monitoring' },
      { id: 'mlops-dashboard', label: 'MLOps', route: ROUTES.MLOPS, color: 'indigo', symbolId: 'mlops', visible: true, requiredFeature: 'mlops-dashboard' },
      { id: 'admin-settings', label: 'Settings', route: ROUTES.ACCOUNT_SETTINGS, color: 'gray', symbolId: 'settings', visible: true, requiredFeature: 'settings-admin' },
    ],
  },
]