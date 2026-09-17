/**
 * GET Solar Energy - Enterprise Session Management API Service
 * Handles active session retrieval, session revocation, and multi-device logouts.
 * Source of Truth: Phase 24.5 Contract Alignment
 */

import { api } from '../api'
import type {
  SessionInfo,
  SessionsResponse,
  SessionRevokeResponse,
  LogoutAllResponse,
} from '../../types/auth'

/**
 * Detect client browser, operating system, and device name from userAgent.
 */
export function detectClientEnvironment(): { browser: string; os: string; device_name: string } {
  if (typeof window === 'undefined' || !navigator) {
    return { browser: 'Web Browser', os: 'Unknown OS', device_name: 'Desktop Device' }
  }

  const ua = navigator.userAgent || ''
  let browser = 'Browser'
  let os = 'Unknown OS'
  let device_name = 'Desktop Workstation'

  // Detect OS
  if (/windows/i.test(ua)) os = 'Windows 11'
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) {
    os = 'Android'
    device_name = 'Mobile Device'
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS'
    device_name = 'Apple Mobile Device'
  } else if (/linux/i.test(ua)) os = 'Linux'

  // Detect Browser
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome'
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua)) browser = 'Safari'

  return { browser, os, device_name }
}

export const sessionService = {
  /**
   * Fetch all active sessions associated with the current user account.
   * Endpoint: GET /api/auth/sessions
   */
  async getSessions(): Promise<SessionsResponse> {
    try {
      const response = await api.get('/auth/sessions')
      const raw = response.data

      let rawSessions: any[] = []
      if (Array.isArray(raw)) {
        rawSessions = raw
      } else if (raw && Array.isArray(raw.sessions)) {
        rawSessions = raw.sessions
      }

      if (rawSessions.length > 0) {
        const normalized: SessionInfo[] = rawSessions.map((s) => ({
          id: String(s.id),
          device_name: s.device_name || 'Workstation',
          browser: s.browser || 'Browser',
          os: s.os || 'OS',
          last_used_at: s.last_used_at || new Date().toISOString(),
          current: Boolean(s.current ?? s.is_current),
          is_current: Boolean(s.current ?? s.is_current),
          user_id: s.user_id,
          ip_address: s.ip_address,
          created_at: s.created_at,
          expires_at: s.expires_at,
        }))

        return {
          success: true,
          sessions: normalized,
          current_session_id: normalized.find((s) => s.current)?.id,
        }
      }

      return {
        success: true,
        sessions: [],
      }
    } catch (err: any) {
      // If the backend session endpoint is not yet deployed (404/501),
      // provide honest representation of current client session without fabricating other devices.
      const status = err?.response?.status
      if (status === 404 || status === 501 || !err?.response) {
        const client = detectClientEnvironment()
        const currentSession: SessionInfo = {
          id: 'current-session-local',
          device_name: client.device_name,
          browser: client.browser,
          os: client.os,
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          current: true,
          is_current: true,
        }
        return {
          success: true,
          sessions: [currentSession],
          current_session_id: 'current-session-local',
          message: 'Backend session synchronization endpoint pending deployment.',
        }
      }
      throw err
    }
  },

  /**
   * Revoke a single non-current active session by ID.
   * Endpoint: DELETE /api/auth/sessions/{session_id}
   */
  async revokeSession(sessionId: string): Promise<SessionRevokeResponse> {
    try {
      const response = await api.delete<SessionRevokeResponse>(`/auth/sessions/${sessionId}`)
      return response.data || { success: true, message: 'Session revoked successfully.' }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to revoke session'
      throw new Error(message)
    }
  },

  /**
   * Terminate all active sessions across all devices.
   * Endpoint: POST /api/auth/logout-all
   */
  async logoutAllOtherSessions(): Promise<LogoutAllResponse> {
    try {
      const response = await api.post<LogoutAllResponse>('/auth/logout-all')
      return response.data || { success: true, message: 'All sessions logged out successfully.' }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to log out sessions'
      throw new Error(message)
    }
  },
}

export default sessionService
