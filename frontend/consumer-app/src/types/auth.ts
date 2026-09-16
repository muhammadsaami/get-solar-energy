/**
 * GET Solar Energy - Enterprise Security & Session Management Types
 * Source of Truth: Phase 24.5 Finalized Backend Session Contract
 */

export interface SessionInfo {
  id: string
  device_name: string
  browser: string
  os: string
  last_used_at: string
  current: boolean
  is_current?: boolean
  user_id?: string
  ip_address?: string
  created_at?: string
  expires_at?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: Record<string, unknown>
  success?: boolean
  token?: string
  message?: string
}

export interface RefreshResponse {
  access_token: string
  expires_in: number
}

export interface SessionRevokeResponse {
  success: boolean
  message: string
}

export interface LogoutAllResponse {
  success: boolean
  message: string
  revoked_count?: number
}

export interface SessionsResponse {
  success: boolean
  sessions: SessionInfo[]
  current_session_id?: string
  message?: string
}
