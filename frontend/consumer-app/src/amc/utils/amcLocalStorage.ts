const STORAGE_KEY = 'lastGeneratedAmc'

export function saveAMCToLocalStorage<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* storage full or unavailable */
  }
}

export function loadAMCFromLocalStorage<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function clearAMCFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
