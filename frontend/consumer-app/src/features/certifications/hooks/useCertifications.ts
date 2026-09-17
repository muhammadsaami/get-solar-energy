import { useState, useEffect, useCallback, useMemo } from 'react'
import { certificationsApi } from '../services/certifications.api'
import { adaptCertificationsData } from '../adapters/certificationsAdapter'
import type {
  CanonicalCertification,
  AdaptedCertificationsData,
  CertificationCategory,
} from '../types/certifications.types'
import { useNotificationStore } from '../../../stores/notificationStore'

export function useCertifications() {
  const [data, setData] = useState<AdaptedCertificationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Tabs State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'active' | 'completed' | 'timeline' | 'skills'>('dashboard')
  const [selectedCategory, setSelectedCategory] = useState<CertificationCategory | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Drawer State
  const [selectedCertification, setSelectedCertification] = useState<CanonicalCertification | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerContentType, setDrawerContentType] = useState<'detail' | 'verify' | 'renewal'>('detail')

  const addToast = useNotificationStore(s => s.addToast)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rawDashboard = await certificationsApi.getDashboard()
      const adapted = adaptCertificationsData(rawDashboard)
      setData(adapted)
    } catch {
      setError('Failed to load technician certification credentials.')
      addToast({ type: 'error', message: 'Failed to load technician certifications' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openDrawer = useCallback((cert: CanonicalCertification, contentType: 'detail' | 'verify' | 'renewal' = 'detail') => {
    setSelectedCertification(cert)
    setDrawerContentType(contentType)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedCertification(null)
  }, [])

  const filteredCertifications = useMemo(() => {
    if (!data) return []
    let list = data.all

    if (activeTab === 'active') {
      list = data.active
    } else if (activeTab === 'completed') {
      list = data.completed
    }

    if (selectedCategory !== 'All') {
      list = list.filter(c => c.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.badgeName.toLowerCase().includes(q) ||
          c.certificateNumber.toLowerCase().includes(q) ||
          c.skillsUnlocked.some(s => s.toLowerCase().includes(q))
      )
    }

    return list
  }, [data, activeTab, selectedCategory, searchQuery])

  const handleDownload = useCallback(async (certId: string) => {
    try {
      const res = await certificationsApi.downloadCertificate(certId)
      if (res.success) {
        addToast({ type: 'success', message: 'Certificate PDF download initiated!' })
      } else {
        addToast({ type: 'error', message: 'Download failed. Please try again.' })
      }
    } catch {
      addToast({ type: 'error', message: 'Download error.' })
    }
  }, [addToast])

  const handleShare = useCallback(async (certId: string) => {
    try {
      const res = await certificationsApi.shareCertificate(certId)
      if (res.success && res.shareUrl) {
        await navigator.clipboard.writeText(res.shareUrl)
        addToast({ type: 'success', message: 'Verification URL copied to clipboard!' })
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to share verification link.' })
    }
  }, [addToast])

  return {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedCertification,
    isDrawerOpen,
    drawerContentType,
    openDrawer,
    closeDrawer,
    filteredCertifications,
    handleDownload,
    handleShare,
    reload: loadData,
  }
}
