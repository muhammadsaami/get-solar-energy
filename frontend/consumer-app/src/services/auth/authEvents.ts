export const AuthEventTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REFRESHED: 'SESSION_REFRESHED',
  SESSION_RESTORED: 'SESSION_RESTORED',
  FORCE_LOGOUT: 'FORCE_LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const

export type AuthEventType = (typeof AuthEventTypes)[keyof typeof AuthEventTypes]

export interface AuthEventPayload {
  reason?: string
  sessionId?: string
  crossTab?: boolean
  [key: string]: unknown
}

type AuthEventHandler = (payload: AuthEventPayload) => void

const listeners = new Map<AuthEventType, Set<AuthEventHandler>>()

export const authEvents = {
  on(type: AuthEventType, handler: AuthEventHandler): () => void {
    let set = listeners.get(type)
    if (!set) {
      set = new Set()
      listeners.set(type, set)
    }
    set.add(handler)
    return () => {
      set.delete(handler)
    }
  },

  off(type: AuthEventType, handler: AuthEventHandler): void {
    listeners.get(type)?.delete(handler)
  },

  emit(type: AuthEventType, payload: AuthEventPayload = {}): void {
    const set = listeners.get(type)
    if (!set) return
    set.forEach((handler) => {
      try {
        handler(payload)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`[authEvents] handler error for ${type}:`, error)
        }
      }
    })
  },

  clear(): void {
    listeners.clear()
  },
}
