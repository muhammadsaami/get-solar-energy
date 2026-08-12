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

import { tokenManager } from '../services/auth/tokenManager'

export function getUser(): { email: string; name: string; referral_code: string } | null {
  return tokenManager.getUser() as { email: string; name: string; referral_code: string } | null
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
