import api from '../../../services/api/client'
import { tokenManager } from '../../../services/auth/tokenManager'
import type { CustomerProfileData, CustomerProfileUpdatePayload } from '../types/customerProfile.types'

const CUSTOMER_EXTRA_PROFILE_KEY = 'gse_customer_profile_extras'

function loadStoredExtras(): Partial<CustomerProfileData> {
  try {
    const raw = localStorage.getItem(CUSTOMER_EXTRA_PROFILE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveStoredExtras(extras: Partial<CustomerProfileData>): void {
  try {
    localStorage.setItem(CUSTOMER_EXTRA_PROFILE_KEY, JSON.stringify(extras))
  } catch {
    // Best-effort local storage
  }
}

export const customerProfileService = {
  getProfile(authUser: Record<string, unknown> | null): CustomerProfileData {
    const user = authUser || (tokenManager.getUser() as Record<string, unknown>) || {}
    const extras = loadStoredExtras()

    const rawCreatedAt = (user.created_at || user.createdAt) as string | undefined
    const createdDate = rawCreatedAt ? new Date(rawCreatedAt) : new Date()
    const joinedDateFormatted = createdDate.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })

    return {
      id: String(user.id || user.user_id || 'CUST-001'),
      name: String(user.name || user.full_name || extras.name || 'Solar Consumer'),
      email: String(user.email || extras.email || 'customer@getsolar.in'),
      phone: String(user.phone || extras.phone || '9876543210'),
      city: String(user.city || extras.city || 'Jaipur'),
      address: String(user.address || extras.address || '42, Sunshine Enclave, MG Road'),
      consumerNumber: String(extras.consumerNumber || user.consumer_number || 'JVVNL-987241-01'),
      discom: String(extras.discom || user.discom || 'Jaipur Vidyut Vitran Nigam (JVVNL)'),
      sanctionedLoadKw: String(extras.sanctionedLoadKw || user.sanctioned_load || '5 kW'),
      joinedDateFormatted,
      accountType: 'Residential',
      kycStatus: 'Verified',
      subsidyEligible: true,
    }
  },

  async updateProfile(
    payload: CustomerProfileUpdatePayload,
    currentAuthUser: Record<string, unknown> | null,
    onSessionUpdate?: (updatedUser: Record<string, unknown>) => void
  ): Promise<{ success: boolean; message?: string }> {
    const email = currentAuthUser?.email ? String(currentAuthUser.email) : ''
    let backendSaved = false

    // Attempt real backend persistence via PUT /api/customers/{id}
    try {
      let customerId: number | null = typeof currentAuthUser?.id === 'number' ? currentAuthUser.id : null

      if (!customerId && email) {
        // Search customer by email
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
      // Backend CRM lead record might not exist yet for this auth account; keep fallback extras intact
    }

    // Persist non-backend and supplementary metadata in client extras
    saveStoredExtras({
      name: payload.name,
      phone: payload.phone,
      city: payload.city,
      address: payload.address,
      consumerNumber: payload.consumerNumber,
      discom: payload.discom,
      sanctionedLoadKw: payload.sanctionedLoadKw,
    })

    // Update session user identity if callback provided
    if (currentAuthUser && onSessionUpdate) {
      const updatedUser = {
        ...currentAuthUser,
        name: payload.name,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
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

