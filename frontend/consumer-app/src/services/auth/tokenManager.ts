import { getTokenStorage, setTokenStorage, type TokenStorage } from './authStorage'

export interface BootstrapResult {
  hasSession: boolean
  expired: boolean
  token: string | null
  user: unknown
}

export interface SessionSnapshot {
  token: string | null
  user: unknown
  expired: boolean
}

function decodePayload<T = Record<string, unknown>>(token: string | null): T | null {
  if (!token) return null
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as T
  } catch {
    return null
  }
}

export function decodeToken(token: string | null): Record<string, unknown> | null {
  return decodePayload(token)
}

function expiryFromToken(token: string | null): number | null {
  const payload = decodePayload<{ exp?: number }>(token)
  if (payload && typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
    return payload.exp * 1000
  }
  return null
}

function parseUser(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const tokenManager = {
  setAdapter(adapter: TokenStorage): void {
    setTokenStorage(adapter)
  },

  getAdapter(): TokenStorage {
    return getTokenStorage()
  },

  getAccessToken(): string | null {
    return getTokenStorage().getAccessToken()
  },

  getUser(): unknown {
    return parseUser(getTokenStorage().getUser())
  },

  getExpiry(): number | null {
    const raw = getTokenStorage().getExpiry()
    if (raw) {
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) return parsed
    }
    return expiryFromToken(getTokenStorage().getAccessToken())
  },

  tokenExpired(clockSkewSec = 0): boolean {
    const token = getTokenStorage().getAccessToken()
    if (!token) return false
    const expiry = tokenManager.getExpiry()
    if (expiry === null) return true
    return expiry < Date.now() + clockSkewSec * 1000
  },

  setAccessToken(token: string | null, expiresInSec?: number): void {
    getTokenStorage().setAccessToken(token)
    if (!token) {
      getTokenStorage().setExpiry(null)
      return
    }
    if (typeof expiresInSec === 'number' && expiresInSec > 0) {
      const expiry = Date.now() + expiresInSec * 1000
      getTokenStorage().setExpiry(String(expiry))
    } else {
      const expiry = expiryFromToken(token)
      getTokenStorage().setExpiry(expiry !== null ? String(expiry) : null)
    }
  },

  setUser(user: unknown): void {
    getTokenStorage().setUser(user ? JSON.stringify(user) : null)
  },

  clearTokens(): void {
    getTokenStorage().clear()
  },

  bootstrap(): BootstrapResult {
    const storage = getTokenStorage()
    const token = storage.getAccessToken()
    const userJson = storage.getUser()

    if (!token || !userJson) {
      return { hasSession: false, expired: false, token: null, user: null }
    }

    const expiry = tokenManager.getExpiry()
    if (expiry === null || expiry < Date.now()) {
      return { hasSession: false, expired: true, token, user: null }
    }

    const user = parseUser(userJson)
    if (user === null) {
      return { hasSession: false, expired: true, token, user: null }
    }

    return { hasSession: true, expired: false, token, user }
  },

  readSession(): SessionSnapshot {
    const result = tokenManager.bootstrap()
    return { token: result.token, user: result.user, expired: result.expired }
  },
}
