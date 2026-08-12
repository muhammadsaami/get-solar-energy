export interface User {
  id: number
  email: string
  name: string
  role: 'customer' | 'vendor' | 'admin' | 'engineer'
  avatar: string
  phone?: string
  city?: string
}

export interface AuthTokens {
  access_token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData extends LoginCredentials {
  name: string
  phone: string
  city: string
}
