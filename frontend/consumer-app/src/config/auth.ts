export interface AuthProviderConfig {
  id: string
  label: string
  description: string
  loginEndpoint: string
  signupEndpoint: string
  defaultRoute: string
}

export const AUTH_PROVIDERS: Record<string, AuthProviderConfig> = {
  customer: {
    id: 'customer',
    label: 'Customer',
    description: 'Access your Solar Intelligence Dashboard, monitor your solar system, analyze bills, track savings, and manage your energy journey.',
    loginEndpoint: '/login',
    signupEndpoint: '/signup',
    defaultRoute: '/app/home',
  },
  vendor: {
    id: 'vendor',
    label: 'Vendor',
    description: 'Access your EPC Vendor Workspace to manage projects, installations, customers, inventory, payments, and analytics.',
    loginEndpoint: '/login',
    signupEndpoint: '/signup',
    defaultRoute: '/app/vendor/dashboard',
  },
  technician: {
    id: 'technician',
    label: 'Technician',
    description: 'Access your Technician Workspace, manage work orders, AI troubleshooting, certifications, earnings, and performance.',
    loginEndpoint: '/technician/login',
    signupEndpoint: '/technician/signup',
    defaultRoute: '/app/technician/dashboard',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Access the Executive Administration Console to monitor enterprise operations, system health, business intelligence, CRM leads, and MLOps.',
    loginEndpoint: '/login',
    signupEndpoint: '/signup',
    defaultRoute: '/app/admin/dashboard',
  },
}

export const PUBLIC_AUTH_ROLES = ['customer', 'vendor', 'technician'] as const
export type PublicAuthRole = typeof PUBLIC_AUTH_ROLES[number]
