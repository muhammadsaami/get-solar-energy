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
    description: 'Access your Solar Intelligence Dashboard',
    loginEndpoint: '/login',
    signupEndpoint: '/signup',
    defaultRoute: '/app/home',
  },
  technician: {
    id: 'technician',
    label: 'Technician',
    description: 'Access your Technician Network Dashboard',
    loginEndpoint: '/technician/login',
    signupEndpoint: '/technician/signup',
    defaultRoute: '/app/technician/dashboard',
  },
}
