/**
 * Safe Avatar URL Normalization Utility
 * Normalizes avatar paths/URLs safely across local development, proxied environments,
 * and remote backend origins.
 */

export function resolveAvatarUrl(avatar?: string | null): string | null {
  if (avatar === null || avatar === undefined) {
    return null
  }

  if (typeof avatar !== 'string') {
    return null
  }

  const trimmed = avatar.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null
  }

  // Reject local disk/filesystem paths (Windows drive letters, backslashes, UNC paths)
  if (
    /^[a-zA-Z]:[/\\]/.test(trimmed) ||
    trimmed.startsWith('\\\\') ||
    (trimmed.includes('\\') && !trimmed.includes('/')) ||
    /^[/\\](Users|home|var|tmp|Windows|Program Files)/i.test(trimmed)
  ) {
    return null
  }

  // Already an absolute URL or embedded data/blob URI
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed
  }

  // Relative path (e.g. /uploads/abc.jpg or uploads/abc.jpg)
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  // If VITE_API_URL is configured as an absolute URL, resolve against its origin
  const apiUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).trim()
    : ''

  if (/^https?:\/\//i.test(apiUrl)) {
    try {
      const urlObj = new URL(apiUrl)
      return `${urlObj.origin}${cleanPath}`
    } catch {
      // fallback to cleanPath
    }
  }

  // In default local development or standard reverse-proxied deployments,
  // relative path is served via Vite / Nginx proxy without double prefixing
  return cleanPath
}
