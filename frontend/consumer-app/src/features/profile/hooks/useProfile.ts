import { useState, useEffect, useCallback } from 'react'
import { profileApi } from '../services/profile.api'
import { adaptProfileData } from '../adapters/profileAdapter'
import type { AdaptedProfileData, AchievementBadge } from '../types/profile.types'
import { useNotificationStore } from '../../../stores/notificationStore'

export function useProfile() {
  const [data, setData] = useState<AdaptedProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'skills' | 'regions'>('overview')

  // Drawer State
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const addToast = useNotificationStore(s => s.addToast)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const canonical = await profileApi.getProfile()
      const adapted = adaptProfileData(canonical)
      setData(adapted)
    } catch {
      setError('Failed to load technician profile & performance metadata.')
      addToast({ type: 'error', message: 'Failed to load technician profile' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openDrawer = useCallback((badge: AchievementBadge) => {
    setSelectedBadge(badge)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedBadge(null)
  }, [])

  const handleUpdateProfile = useCallback(
    async (updateFields: { name?: string; phone?: string; city?: string }) => {
      setIsUpdating(true)
      try {
        const res = await profileApi.updateProfile(updateFields)
        if (res.success) {
          addToast({ type: 'success', message: res.message || 'Profile updated successfully.' })
          await loadData()
        } else {
          addToast({ type: 'error', message: 'Profile update failed.' })
        }
      } catch {
        addToast({ type: 'error', message: 'Error updating technician profile.' })
      } finally {
        setIsUpdating(false)
      }
    },
    [loadData, addToast]
  )

  return {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedBadge,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleUpdateProfile,
    isUpdating,
    reload: loadData,
  }
}
