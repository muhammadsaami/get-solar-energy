import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useNotificationStore } from '../../../stores/notificationStore'
import { customerProfileService } from '../services/customerProfile.service'
import type { CustomerProfileData, CustomerProfileUpdatePayload } from '../types/customerProfile.types'

export function useCustomerProfile() {
  const { user, token, setSession } = useAuth() as unknown as {
    user: Record<string, unknown> | null
    token: string | null
    setSession: (token: string | null, user: Record<string, unknown>) => void
  }

  const addToast = useNotificationStore((s) => s.addToast)

  const [profile, setProfile] = useState<CustomerProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<CustomerProfileUpdatePayload>({
    name: '',
    phone: '',
    city: '',
    address: '',
    consumerNumber: '',
    discom: '',
    sanctionedLoadKw: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadProfile = useCallback(() => {
    setLoading(true)
    try {
      const data = customerProfileService.getProfile(user)
      setProfile(data)
      setFormData({
        name: data.name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        consumerNumber: data.consumerNumber || '',
        discom: data.discom || '',
        sanctionedLoadKw: data.sanctionedLoadKw || '',
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleInputChange = (field: keyof CustomerProfileUpdatePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required'
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[\s+-]/g, ''))) {
      nextErrors.phone = 'Enter a valid 10-digit mobile number'
    }
    if (!formData.city.trim()) {
      nextErrors.city = 'City is required'
    }
    if (!formData.address.trim()) {
      nextErrors.address = 'Installation address is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return false

    setSaving(true)
    try {
      await customerProfileService.updateProfile(formData, user, (updatedUser) => {
        if (token) {
          setSession(token, updatedUser)
        }
      })

      setProfile((prev) => (prev ? { ...prev, ...formData } : null))
      setIsEditing(false)
      addToast({
        type: 'success',
        message: 'Customer profile updated successfully.',
      })
      return true
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to update profile. Please try again.',
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        city: profile.city,
        address: profile.address,
        consumerNumber: profile.consumerNumber || '',
        discom: profile.discom || '',
        sanctionedLoadKw: profile.sanctionedLoadKw || '',
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  return {
    profile,
    loading,
    saving,
    isEditing,
    formData,
    errors,
    setIsEditing,
    handleInputChange,
    handleSave,
    handleCancel,
    reload: loadProfile,
  }
}
