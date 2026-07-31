export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
  LOGOUT: 'AUTH_LOGOUT',
  SIGNUP_SUCCESS: 'AUTH_SIGNUP_SUCCESS',
  SIGNUP_FAILURE: 'AUTH_SIGNUP_FAILURE',
  SESSION_RESTORED: 'AUTH_SESSION_RESTORED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
} as const

export function logAuthEvent(event: string, metadata?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.groupCollapsed(`[Auth] ${event}`)
    console.log('timestamp:', new Date().toISOString())
    if (metadata) console.log('metadata:', metadata)
    console.groupEnd()
  }
}
