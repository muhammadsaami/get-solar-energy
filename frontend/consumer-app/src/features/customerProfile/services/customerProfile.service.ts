import api from '../../../services/api/client'
import { tokenManager } from '../../../services/auth/tokenManager'
import type { CustomerProfileData, CustomerProfileUpdatePayload } from '../types/customerProfile.types'

const CUSTOMER_EXTRA_PROFILE_PREFIX = 'gse_customer_profile_extras_'

function getUserKey(user?: Record<string, unknown> | null): string {
  if (!user) return 'default'
  return String(user.email || user.id || 'default').toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

function loadStoredExtras(userKey: string): Partial<CustomerProfileData> {
  try {
    const raw = localStorage.getItem(`${CUSTOMER_EXTRA_PROFILE_PREFIX}${userKey}`)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveStoredExtras(userKey: string, extras: Partial<CustomerProfileData>): void {
  try {
    localStorage.setItem(`${CUSTOMER_EXTRA_PROFILE_PREFIX}${userKey}`, JSON.stringify(extras))
  } catch {
    // Best-effort local storage
  }
}

export const customerProfileService = {
  getProfile(authUser?: Record<string, unknown> | null): CustomerProfileData {
    const user = authUser || (tokenManager.getUser() as Record<string, unknown>) || {}
    const userKey = getUserKey(user)
    const extras = loadStoredExtras(userKey)

    const rawCreatedAt = (user.created_at || user.createdAt) as string | undefined
    const createdDate = rawCreatedAt ? new Date(rawCreatedAt) : new Date()
    const joinedDateFormatted = createdDate.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })

    const name = String(user.name || user.full_name || extras.name || '').trim() || 'Solar Consumer'
    const email = String(user.email || extras.email || '').trim()
    const phone = String(user.phone || extras.phone || '').trim()
    const city = String(user.city || extras.city || '').trim()
    const address = String(user.address || extras.address || '').trim()
    const consumerNumber = extras.consumerNumber || (user.consumer_number as string) || (user.consumerNumber as string) || undefined
    const discom = extras.discom || (user.discom as string) || undefined
    const sanctionedLoadKw = extras.sanctionedLoadKw || (user.sanctioned_load as string) || (user.sanctionedLoadKw as string) || undefined
    const avatar = String(extras.avatar || user.avatar || user.avatarUrl || user.profile_image || '').trim() || undefined

    return {
      id: user.id ? String(user.id) : undefined,
      name,
      email,
      phone,
      city,
      address,
      consumerNumber,
      discom,
      sanctionedLoadKw,
      avatar,
      joinedDateFormatted,
      accountType: 'Residential',
      kycStatus: 'Verified',
      subsidyEligible: true,
    }
  },

  saveProfileExtras(authUser: Record<string, unknown> | null, extras: Partial<CustomerProfileData>): void {
    const user = authUser || (tokenManager.getUser() as Record<string, unknown>) || {}
    const userKey = getUserKey(user)
    const existing = loadStoredExtras(userKey)
    saveStoredExtras(userKey, { ...existing, ...extras })
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (res.data?.file_url) {
      return res.data.file_url
    }
    throw new Error(res.data?.detail || 'Failed to upload image')
  },

  async updateProfile(
    payload: CustomerProfileUpdatePayload,
    currentAuthUser: Record<string, unknown> | null,
    onSessionUpdate?: (updatedUser: Record<string, unknown>) => void
  ): Promise<{ success: boolean; message?: string }> {
    const user = currentAuthUser || (tokenManager.getUser() as Record<string, unknown>) || {}
    const userKey = getUserKey(user)
    const email = user?.email ? String(user.email) : ''
    let backendSaved = false

    // Attempt backend user profile update via PUT /api/user/profile
    try {
      await api.put('/user/profile', {
        name: payload.name,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
        avatar: payload.avatar,
      })
      backendSaved = true
    } catch {
      // Best-effort backend call
    }

    // Also attempt CRM customer update via PUT /api/customers/{id} if linked
    try {
      let customerId: number | null = typeof user?.id === 'number' ? user.id : null

      if (!customerId && email) {
        const searchRes = await api.get('/customers/search', { params: { q: email } })
        if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
          const matched = searchRes.data.find(
            (c: { email?: string; id?: number }) => c.email?.toLowerCase() === email.toLowerCase()
          )
          if (matched && typeof matched.id === 'number') {
            customerId = matched.id
          }
        }
      }

      if (customerId) {
        const updateBody: Record<string, unknown> = {
          customer_name: payload.name,
          phone: payload.phone,
          city: payload.city,
          address: payload.address,
        }
        if (payload.discom) {
          updateBody.discom = payload.discom
        }
        await api.put(`/customers/${customerId}`, updateBody)
        backendSaved = true
      }
    } catch {
      // Backend CRM lead record might not exist yet for this auth account; keep extras intact
    }

    // Persist scoped extras locally per user
    saveStoredExtras(userKey, {
      name: payload.name,
      phone: payload.phone,
      city: payload.city,
      address: payload.address,
      consumerNumber: payload.consumerNumber,
      discom: payload.discom,
      sanctionedLoadKw: payload.sanctionedLoadKw,
      avatar: payload.avatar,
    })

    // Update session user identity if callback provided
    if (onSessionUpdate) {
      const updatedUser = {
        ...user,
        name: payload.name,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
        avatar: payload.avatar,
      }
      onSessionUpdate(updatedUser)
    }

    return {
      success: true,
      message: backendSaved
        ? 'Customer profile saved to platform database.'
        : 'Customer profile updated successfully.',
    }
  },
}

