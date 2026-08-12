import api from '../api/client'
import type { LoginResponse, RefreshResponse } from '../../types/auth'

export interface LoginParams {
  email: string
  password: string
  roleHint?: string
  rememberMe?: boolean
}

export interface SignupData {
  name: string
  phone: string
  email: string
  password: string
  city: string
  role?: string
  gst?: string
}

export const authService = {
  /**
   * Primary login endpoint supporting customer, vendor, and admin roles.
   * Sends remember_me flag to establish server-side HttpOnly refresh cookie session.
   */
  async login({ email, password, roleHint, rememberMe }: LoginParams): Promise<LoginResponse> {
    const payload = {
      email,
      password,
      ...(roleHint ? { role_hint: roleHint } : {}),
      remember_me: Boolean(rememberMe),
    }

    try {
      const res = await api.post<LoginResponse>('/auth/login', payload)
      return res.data
    } catch (err: any) {
      // Fallback to legacy /login route if /auth/login is not yet routed
      if (err?.response?.status === 404) {
        const fallbackRes = await api.post<LoginResponse>('/login', payload)
        return fallbackRes.data
      }
      throw err
    }
  },

  /**
   * Token refresh endpoint.
   * Browser automatically transmits the HttpOnly refresh cookie.
   * Returns newly rotated access_token and expires_in.
   */
  async refresh(): Promise<RefreshResponse> {
    try {
      const res = await api.post<RefreshResponse>('/auth/refresh')
      return res.data
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallbackRes = await api.post<RefreshResponse>('/refresh')
        return fallbackRes.data
      }
      throw err
    }
  },

  /**
   * Fetch currently authenticated user via session cookie or access token.
   */
  async getCurrentUser(): Promise<any> {
    try {
      const res = await api.get('/auth/me')
      return res.data
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallbackRes = await api.get('/me')
        return fallbackRes.data
      }
      throw err
    }
  },

  /**
   * Logout current session on server and clear HttpOnly refresh cookie.
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          await api.post('/logout')
        } catch {
          // Ignore offline/unavailable server error during logout
        }
      }
    }
  },

  /**
   * Invalidate all active sessions for current user.
   */
  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all')
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          await api.post('/logout-all')
        } catch {
          // Ignore if endpoint pending backend implementation
        }
      }
    }
  },

  async signup(userData: SignupData) {
    const res = await api.post('/signup', userData)
    return res.data
  },

  async forgotPassword(email: string) {
    const res = await api.post('/forgot-password', { email })
    return res.data
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await api.post('/reset-password', { token, new_password: newPassword })
    return res.data
  },

  async technicianLogin({ email, password, rememberMe }: LoginParams) {
    const res = await api.post('/technician/login', {
      email,
      password,
      remember_me: Boolean(rememberMe),
    })
    return res.data
  },

  async technicianSignup(userData: Record<string, string>) {
    const res = await api.post('/technician/signup', userData)
    return res.data
  },

  async technicianGetProfile() {
    const res = await api.get('/technician/profile')
    return res.data
  },
}

export default authService
