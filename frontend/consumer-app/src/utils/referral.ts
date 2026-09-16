import { tokenManager } from '../services/auth/tokenManager'

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => {
      return fallbackCopy(text)
    })
  }
  return fallbackCopy(text)
}

function fallbackCopy(text: string): Promise<boolean> {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return Promise.resolve(true)
  } catch {
    return Promise.resolve(false)
  }
}

export function copyReferralCode(code: string): Promise<boolean> {
  return copyToClipboard(code)
}

export function copyReferralLink(code: string): Promise<boolean> {
  const link = `https://getsolar.energy/signup?ref=${code}`
  return copyToClipboard(link)
}

export function shareOnWhatsApp(code: string): void {
  const link = `https://getsolar.energy/signup?ref=${code}`
  const msg = encodeURIComponent(
    `🌞 Switch to solar with GET Solar Energy! Use my referral code ${code} for bonus rewards. Sign up here: ${link}`
  )
  window.open(`https://wa.me/?text=${msg}`, '_blank')
}

export function formatNumber(n: number): string {
  return Number(n).toLocaleString('en-IN')
}

export function deriveCustomerReferralCode(user: { id?: number | string; email?: string; name?: string; referral_code?: string } | null): string {
  if (!user) return 'GET-SOLAR-GUEST'
  if (user.referral_code && user.referral_code !== 'SOLAR2024') return user.referral_code

  const identifier = (user.email || user.name || String(user.id || 'USER')).toLowerCase()
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = ((hash << 5) - hash) + identifier.charCodeAt(i)
    hash |= 0
  }
  const cleanHash = Math.abs(hash).toString(36).toUpperCase().padStart(4, '0').slice(-4)
  const namePrefix = (user.name ? user.name.split(' ')[0] : 'SOLAR').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'SOLAR'
  const idSuffix = user.id ? String(user.id) : ''
  return `GET-${namePrefix}${idSuffix}-${cleanHash}`
}

export function getUser(): { id: string | number; email: string; name: string; referral_code: string } | null {
  const raw = tokenManager.getUser() as Record<string, unknown> | null
  if (!raw) return null
  const u = (raw.user as Record<string, unknown> | undefined) || raw
  const id = (u.id as number | string) ?? ''
  const email = (u.email as string) || ''
  const name = (u.name as string) || ''
  const explicitRef = (u.referral_code as string) || (raw.referral_code as string)
  const refCode = (explicitRef && explicitRef !== 'SOLAR2024') ? explicitRef : deriveCustomerReferralCode({ id, email, name })
  return { id, email, name, referral_code: refCode }
}

export function getStatusBadgeStyle(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case 'completed':
      return { bg: 'rgba(54,211,153,0.12)', color: '#36d399', label: 'Completed' }
    case 'pending':
    case 'registered':
    case 'qualified':
      return { bg: 'rgba(255,183,77,0.12)', color: '#ffb74d', label: 'Pending' }
    default:
      return { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', label: status }
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'voucher': return '🎫'
    case 'cashback': return '💰'
    default: return '🔧'
  }
}
