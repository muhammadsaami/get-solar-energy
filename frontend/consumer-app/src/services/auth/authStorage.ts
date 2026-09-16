export interface TokenStorage {
  readonly name: string
  getAccessToken(): string | null
  setAccessToken(token: string | null): void
  getUser(): string | null
  setUser(json: string | null): void
  getExpiry(): string | null
  setExpiry(value: string | null): void
  clear(): void
}

const ACCESS_TOKEN_KEY = 'access_token'
const USER_KEY = 'user'
const EXPIRY_KEY = 'access_token_expires_at'

function safeGet(reader: () => string | null): string | null {
  try {
    return reader()
  } catch {
    return null
  }
}

function safeSet(writer: () => void): void {
  try {
    writer()
  } catch {
    // Storage blocked (private mode / quota) — tokens stay in memory only.
  }
}

export const localStorageAdapter: TokenStorage = {
  name: 'localStorage',
  getAccessToken: () => safeGet(() => localStorage.getItem(ACCESS_TOKEN_KEY)),
  setAccessToken: (token) =>
    safeSet(() => {
      if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token)
      else localStorage.removeItem(ACCESS_TOKEN_KEY)
    }),
  getUser: () => safeGet(() => localStorage.getItem(USER_KEY)),
  setUser: (json) =>
    safeSet(() => {
      if (json) localStorage.setItem(USER_KEY, json)
      else localStorage.removeItem(USER_KEY)
    }),
  getExpiry: () => safeGet(() => localStorage.getItem(EXPIRY_KEY)),
  setExpiry: (value) =>
    safeSet(() => {
      if (value) localStorage.setItem(EXPIRY_KEY, value)
      else localStorage.removeItem(EXPIRY_KEY)
    }),
  clear: () =>
    safeSet(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(EXPIRY_KEY)
    }),
}

const memory = {
  accessToken: null as string | null,
  user: null as string | null,
  expiry: null as string | null,
}

export const memoryAdapter: TokenStorage = {
  name: 'memory',
  getAccessToken: () => memory.accessToken,
  setAccessToken: (token) => {
    memory.accessToken = token
  },
  getUser: () => memory.user,
  setUser: (json) => {
    memory.user = json
  },
  getExpiry: () => memory.expiry,
  setExpiry: (value) => {
    memory.expiry = value
  },
  clear: () => {
    memory.accessToken = null
    memory.user = null
    memory.expiry = null
  },
}

let activeAdapter: TokenStorage = localStorageAdapter

export function setTokenStorage(adapter: TokenStorage): void {
  activeAdapter = adapter
}

export function getTokenStorage(): TokenStorage {
  return activeAdapter
}
