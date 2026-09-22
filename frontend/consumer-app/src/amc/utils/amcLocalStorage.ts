import { getUserStorageKey, type IdentifiableUser } from '../../utils/userStorage'
import { tokenManager } from '../../services/auth/tokenManager'

const LEGACY_GLOBAL_KEY = 'lastGeneratedAmc'

function currentUser(): IdentifiableUser | null {
  try {
    return (tokenManager.getUser() as IdentifiableUser | null) ?? null
  } catch {
    return null
  }
}

function scopedKey(user?: IdentifiableUser | null): string {
  return getUserStorageKey('lastGeneratedAmc', user ?? currentUser())
}

function purgeLegacyGlobalKey(): void {
  // A legacy global value carries no trustworthy ownership: never migrate it
  // into any account. Remove it so it cannot hydrate another customer's state.
  try {
    if (localStorage.getItem(LEGACY_GLOBAL_KEY) !== null) {
      localStorage.removeItem(LEGACY_GLOBAL_KEY)
    }
  } catch {
    /* noop */
  }
}

export function saveAMCToLocalStorage<T>(data: T, user?: IdentifiableUser | null): void {
  try {
    localStorage.setItem(scopedKey(user), JSON.stringify(data))
  } catch {
    /* storage full or unavailable */
  }
}

export function loadAMCFromLocalStorage<T>(user?: IdentifiableUser | null): T | null {
  try {
    const raw = localStorage.getItem(scopedKey(user))
    if (!raw) {
      purgeLegacyGlobalKey()
      return null
    }
    const parsed = JSON.parse(raw) as T
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(scopedKey(user))
      return null
    }
    return parsed
  } catch {
    try {
      localStorage.removeItem(scopedKey(user))
    } catch {
      /* noop */
    }
    return null
  }
}

export function clearAMCFromLocalStorage(user?: IdentifiableUser | null): void {
  try {
    localStorage.removeItem(scopedKey(user))
    purgeLegacyGlobalKey()
  } catch {
    /* noop */
  }
}
