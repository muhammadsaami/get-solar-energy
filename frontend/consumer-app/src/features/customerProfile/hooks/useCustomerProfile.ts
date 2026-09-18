import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useNotificationStore } from '../../../stores/notificationStore'
import { customerProfileService } from '../services/customerProfile.service'
import type { CustomerProfileData, CustomerProfileUpdatePayload } from '../types/customerProfile.types'

export function useCustomerProfile() {
  const auth = (useAuth ? useAuth() : null) as unknown as {
    user?: Record<string, unknown> | null
    token?: string | null
    setSession?: (token: string | null, user: Record<string, unknown>) => void
  } | null
  const user = auth?.user || null
  const token = auth?.token || null
  const setSession = auth?.setSession

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

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarChange = async (file: File): Promise<boolean> => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      addToast({
        type: 'error',
        message: 'Only JPG, PNG, or WEBP images are supported.',
      })
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        message: 'File size must be less than 5MB.',
      })
      return false
    }

    setUploadingAvatar(true)
    try {
      let fileUrl = ''
      try {
        fileUrl = await customerProfileService.uploadAvatar(file)
      } catch {
        fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      await customerProfileService.updateProfile(
        { ...formData, avatar: fileUrl },
        user,
        (updatedUser) => {
          if (token) setSession(token, updatedUser)
        }
      )

      setProfile((prev) => (prev ? { ...prev, avatar: fileUrl } : null))
      setFormData((prev) => ({ ...prev, avatar: fileUrl }))
      addToast({
        type: 'success',
        message: 'Profile picture updated successfully.',
      })
      return true
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to update profile picture.',
      })
      return false
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarRemove = async (): Promise<boolean> => {
    setUploadingAvatar(true)
    try {
      await customerProfileService.updateProfile(
        { ...formData, avatar: '' },
        user,
        (updatedUser) => {
          if (token) setSession(token, { ...updatedUser, avatar: '' })
        }
      )
      setProfile((prev) => (prev ? { ...prev, avatar: undefined } : null))
      setFormData((prev) => ({ ...prev, avatar: '' }))
      addToast({
        type: 'success',
        message: 'Profile picture removed.',
      })
      return true
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to remove profile picture.',
      })
      return false
    } finally {
      setUploadingAvatar(false)
    }
  }

  return {
    profile,
    loading,
    saving,
    uploadingAvatar,
    isEditing,
    formData,
    errors,
    setIsEditing,
    handleInputChange,
    handleSave,
    handleCancel,
    handleAvatarChange,
    handleAvatarRemove,
    reload: loadProfile,
  }
}
