import { tokenManager } from './tokenManager'
import { authEvents, AuthEventTypes, type AuthEventPayload, type AuthEventType } from './authEvents'
import { createIdleMonitor, type IdleMonitor } from './idleSession'
import { proactiveRefreshScheduler, refreshManager } from './refreshManager'
import { authService } from './auth.service'

export interface BootstrapResult {
  hasSession: boolean
  expired: boolean
  token: string | null
  user: unknown
}

export interface SessionEvent {
  type: AuthEventType
  payload: AuthEventPayload
  origin: 'local' | 'remote'
}

type SessionListener = (event: SessionEvent) => void

const BROADCAST_CHANNEL = 'gse-auth-session'
const BROADCAST_SOURCE = 'gse-auth'

interface BroadcastMessage {
  source: string
  type: AuthEventType
  payload: AuthEventPayload
}

const listeners = new Set<SessionListener>()

function emitLocal(type: AuthEventType, payload: AuthEventPayload = {}): void {
  listeners.forEach((listener) => listener({ type, payload, origin: 'local' }))
}

class SessionBroadcast {
  private channel: BroadcastChannel | null = null
  private onRemoteMessage: ((message: BroadcastMessage) => void) | null = null

  connect(handler: (message: BroadcastMessage) => void): void {
    this.onRemoteMessage = handler
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL)
        this.channel.onmessage = (event: MessageEvent) => {
          const message = event.data as BroadcastMessage | undefined
          if (message && message.source === BROADCAST_SOURCE) {
            this.onRemoteMessage?.(message)
          }
        }
        return
      } catch {
        // BroadcastChannel unavailable — fallback to window storage events
      }
    }
    window.addEventListener('storage', this.handleStorageEvent)
  }

  post(type: AuthEventType, payload: AuthEventPayload = {}): void {
    const message: BroadcastMessage = { source: BROADCAST_SOURCE, type, payload }
    try {
      this.channel?.postMessage(message)
    } catch {
      // ignore
    }
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== 'access_token') return
    const restored = tokenManager.bootstrap()
    if (restored.expired) {
      this.onRemoteMessage?.({
        source: BROADCAST_SOURCE,
        type: AuthEventTypes.SESSION_EXPIRED,
        payload: { reason: 'storage-expired', crossTab: true },
      })
    } else if (restored.token && !restored.expired) {
      this.onRemoteMessage?.({
        source: BROADCAST_SOURCE,
        type: AuthEventTypes.SESSION_RESTORED,
        payload: { crossTab: true },
      })
    } else {
      this.onRemoteMessage?.({
        source: BROADCAST_SOURCE,
        type: AuthEventTypes.LOGOUT,
        payload: { reason: 'storage-cleared', crossTab: true },
      })
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.close()
      this.channel = null
    } else {
      window.removeEventListener('storage', this.handleStorageEvent)
    }
  }
}

// Wire single-flight refresh handler to backend POST /api/auth/refresh
refreshManager.setRefreshHandler(async () => {
  try {
    const data = await authService.refresh()
    if (data && data.access_token) {
      tokenManager.setAccessToken(data.access_token, data.expires_in)
      authEvents.emit(AuthEventTypes.SESSION_REFRESHED, {
        expiresIn: data.expires_in,
      })
      return true
    }
    return false
  } catch {
    return false
  }
})

export const sessionManager = {
  broadcast: new SessionBroadcast(),

  /**
   * Startup. Restores a persisted session from the active storage adapter.
   * Pure — emits no events; AuthContext decides how to react.
   */
  bootstrap(): BootstrapResult {
    return tokenManager.bootstrap()
  },

  /** Persist a freshly established session. */
  persistSession(token: string, user: unknown, expiresInSec: number | null = null): void {
    tokenManager.setAccessToken(token, expiresInSec ?? undefined)
    tokenManager.setUser(user)
  },

  /** Clear all persisted auth artifacts. */
  clearSession(): void {
    tokenManager.clearTokens()
  },

  /** Local logout — clears storage and notifies this tab. */
  logout(reason = 'user'): void {
    tokenManager.clearTokens()
    authEvents.emit(AuthEventTypes.LOGOUT, { reason })
    emitLocal(AuthEventTypes.LOGOUT, { reason })
    this.broadcast.post(AuthEventTypes.LOGOUT, { reason })
  },

  /** Session invalidated (expired/401) — clears storage and notifies this tab. */
  sessionExpired(reason = 'unauthorized'): void {
    tokenManager.clearTokens()
    authEvents.emit(AuthEventTypes.SESSION_EXPIRED, { reason })
    emitLocal(AuthEventTypes.SESSION_EXPIRED, { reason })
    this.broadcast.post(AuthEventTypes.SESSION_EXPIRED, { reason })
  },

  /** Admin-initiated remote logout (logout-all / device revoke). */
  forceLogout(reason = 'force'): void {
    tokenManager.clearTokens()
    authEvents.emit(AuthEventTypes.FORCE_LOGOUT, { reason })
    emitLocal(AuthEventTypes.FORCE_LOGOUT, { reason })
    this.broadcast.post(AuthEventTypes.FORCE_LOGOUT, { reason })
  },

  /** Password changed — terminate all other sessions. */
  passwordChanged(): void {
    tokenManager.clearTokens()
    authEvents.emit(AuthEventTypes.PASSWORD_CHANGED, {})
    emitLocal(AuthEventTypes.PASSWORD_CHANGED, {})
    this.broadcast.post(AuthEventTypes.PASSWORD_CHANGED, {})
  },

  /** A specific device session was revoked remotely. */
  sessionRevoked(sessionId: string): void {
    authEvents.emit(AuthEventTypes.SESSION_REVOKED, { sessionId })
    emitLocal(AuthEventTypes.SESSION_REVOKED, { sessionId })
    this.broadcast.post(AuthEventTypes.SESSION_REVOKED, { sessionId })
  },

  /** Refresh token using single-flight HttpOnly cookie flow */
  async refreshSession(): Promise<boolean> {
    return refreshManager.refresh()
  },

  /** Subscribe to session lifecycle events from any origin (this tab or another). */
  subscribe(listener: SessionListener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Begin listening for cross-tab session changes. */
  startBroadcast(): void {
    this.broadcast.connect((message) => {
      const { type, payload } = message
      listeners.forEach((listener) => listener({ type, payload, origin: 'remote' }))
    })
  },

  /** Stop cross-tab listening (used in tests / teardown). */
  stopBroadcast(): void {
    this.broadcast.disconnect()
  },

  /** Idle session monitor. */
  createIdleMonitor(timeoutMs: number): IdleMonitor {
    return createIdleMonitor({ timeoutMs })
  },

  /** Schedule a proactive token refresh at ~70% of TTL. Returns a cancel fn. */
  scheduleRefresh(ttlMs: number, onRefresh: () => void): () => void {
    return proactiveRefreshScheduler.schedule(ttlMs, onRefresh)
  },
}

export default sessionManager
