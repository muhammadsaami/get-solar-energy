import { ROUTES } from '../../config/routes'

export interface VendorNavItem {
  id: string
  label: string
  path: string
  icon: string
  permission: string
  badge?: string
}

export interface VendorNavGroup {
  groupName: string
  items: VendorNavItem[]
}

export const VENDOR_NAV_GROUPS: VendorNavGroup[] = [
  {
    groupName: 'Workspace',
    items: [
      { id: 'vendor-dashboard', label: 'Dashboard', path: ROUTES.VENDOR_DASHBOARD, icon: 'icon-layout-grid', permission: 'vendor-dashboard' },
      { id: 'vendor-projects', label: 'Projects', path: ROUTES.VENDOR_PROJECTS, icon: 'icon-folder', permission: 'vendor-projects', badge: '12 Active' },
      { id: 'vendor-customers', label: 'Customers', path: ROUTES.VENDOR_CUSTOMERS, icon: 'icon-users', permission: 'vendor-customers' },
      { id: 'vendor-leads', label: 'Leads', path: ROUTES.VENDOR_LEADS, icon: 'icon-target', permission: 'vendor-leads', badge: '5 New' },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      { id: 'vendor-installations', label: 'Installations', path: ROUTES.VENDOR_INSTALLATIONS, icon: 'icon-zap', permission: 'vendor-installations' },
      { id: 'vendor-teams', label: 'Teams', path: ROUTES.VENDOR_TEAMS, icon: 'icon-user-check', permission: 'vendor-teams' },
      { id: 'vendor-inventory', label: 'Inventory', path: ROUTES.VENDOR_INVENTORY, icon: 'icon-box', permission: 'vendor-inventory' },
      { id: 'vendor-amc', label: 'AMC Contracts', path: ROUTES.VENDOR_AMC, icon: 'icon-shield-check', permission: 'vendor-amc' },
    ],
  },
  {
    groupName: 'Finance',
    items: [
      { id: 'vendor-payments', label: 'Payments', path: ROUTES.VENDOR_PAYMENTS, icon: 'icon-dollar-sign', permission: 'vendor-payments' },
      { id: 'vendor-reports', label: 'Reports', path: ROUTES.VENDOR_REPORTS, icon: 'icon-file-text', permission: 'vendor-reports' },
      { id: 'vendor-analytics', label: 'Analytics', path: ROUTES.VENDOR_ANALYTICS, icon: 'icon-bar-chart', permission: 'vendor-analytics' },
      { id: 'vendor-documents', label: 'Documents', path: ROUTES.VENDOR_DOCUMENTS, icon: 'icon-paperclip', permission: 'vendor-documents' },
    ],
  },
  {
    groupName: 'Account',
    items: [
      { id: 'vendor-settings', label: 'Settings', path: ROUTES.VENDOR_SETTINGS, icon: 'icon-settings', permission: 'vendor-settings' },
      { id: 'vendor-profile', label: 'Profile', path: ROUTES.VENDOR_PROFILE, icon: 'icon-user', permission: 'vendor-profile' },
    ],
  },
]
