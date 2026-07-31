import { useCallback, useEffect, useMemo, useState } from 'react'
import { knowledgeBaseApi } from '../services/knowledgeBase.api'
import { searchDocuments } from '../services/searchDocuments'
import { useDebounce } from '../../../hooks/useDebounce'
import { useNotificationStore } from '../../../stores/notificationStore'

const EMPTY_FILTERS = {}

export function useKnowledgeBase() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [queryText, setQueryText] = useState('')
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState('relevance')

  const [selectedDocument, setSelectedDocument] = useState(null)
  const [relatedDocuments, setRelatedDocuments] = useState([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const addToast = useNotificationStore((s) => s.addToast)

  const debouncedText = useDebounce(queryText, 250)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await knowledgeBaseApi.getDashboard()
      setDashboard(result)
    } catch {
      setError('Failed to load the knowledge base')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const allDocuments = useMemo(() => {
    if (!dashboard) return []
    if (dashboard.allDocuments && dashboard.allDocuments.length > 0) return dashboard.allDocuments
    return dashboard.latestDocuments
      .concat(dashboard.popularDocuments)
      .concat(dashboard.featuredDocuments)
      .concat(dashboard.bookmarkedDocuments)
      .concat(dashboard.recentlyViewedDocuments)
  }, [dashboard])

  const uniqueDocuments = useMemo(() => {
    const seen = new Set()
    const unique = []
    for (const doc of allDocuments) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id)
        unique.push(doc)
      }
    }
    return unique
  }, [allDocuments])

  const searchResults = useMemo(() => {
    if (uniqueDocuments.length === 0) return []
    return searchDocuments(uniqueDocuments, {
      text: debouncedText,
      filters: activeFilters,
      sortBy,
    })
  }, [uniqueDocuments, debouncedText, activeFilters, sortBy])

  const openDocument = useCallback(async (id) => {
    const [doc, related] = await Promise.all([
      knowledgeBaseApi.getDocument(id),
      knowledgeBaseApi.getRelatedDocuments(id),
    ])
    if (!doc) return
    setSelectedDocument(doc)
    setRelatedDocuments(related)
    setIsDrawerOpen(true)
  }, [])

  const closeDocument = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedDocument(null)
    setRelatedDocuments([])
  }, [])

  const toggleBookmark = useCallback(async (id) => {
    const result = await knowledgeBaseApi.toggleBookmark(id)
    if (!result) return
    setSelectedDocument((prev) => (prev && prev.id === id ? { ...prev, bookmarked: result.bookmarked } : prev))
    setDashboard((prev) => {
      if (!prev) return prev
      const sync = (list) => list.map((d) => (d.id === id ? { ...d, bookmarked: result.bookmarked } : d))
      return {
        ...prev,
        featuredDocuments: sync(prev.featuredDocuments),
        bookmarkedDocuments: prev.bookmarkedDocuments.some((d) => d.id === id)
          ? prev.bookmarkedDocuments.filter((d) => d.id !== id)
          : [result.bookmarked && { id, bookmarked: true }, ...prev.bookmarkedDocuments].filter(Boolean),
        recentlyViewedDocuments: sync(prev.recentlyViewedDocuments),
        popularDocuments: sync(prev.popularDocuments),
        latestDocuments: sync(prev.latestDocuments),
      }
    })
    addToast({ type: 'success', message: result.bookmarked ? 'Bookmarked' : 'Bookmark removed', duration: 2500 })
  }, [addToast])

  const downloadDocument = useCallback(async (id) => {
    const result = await knowledgeBaseApi.downloadDocument(id)
    if (!result) return
    setDashboard((prev) => {
      if (!prev) return prev
      const sync = (list) => list.map((d) => (d.id === id ? { ...d, downloads: result.downloads } : d))
      return {
        ...prev,
        featuredDocuments: sync(prev.featuredDocuments),
        recentlyViewedDocuments: sync(prev.recentlyViewedDocuments),
        popularDocuments: sync(prev.popularDocuments),
        latestDocuments: sync(prev.latestDocuments),
      }
    })
    addToast({ type: 'success', message: 'Download started', duration: 2500 })
  }, [addToast])

  const shareDocument = useCallback(async (id) => {
    const result = await knowledgeBaseApi.shareDocument(id)
    if (!result) return
    addToast({ type: 'info', message: 'Share link copied', duration: 2500 })
  }, [addToast])

  const setFilter = useCallback((id, values) => {
    setActiveFilters((prev) => ({ ...prev, [id]: values }))
  }, [])

  const applyPreset = useCallback((preset) => {
    setQueryText(preset.text || '')
    setActiveFilters(preset.filters || EMPTY_FILTERS)
    setSortBy(preset.sortBy || 'relevance')
  }, [])

  const resetFilters = useCallback(() => {
    setQueryText('')
    setActiveFilters(EMPTY_FILTERS)
    setSortBy('relevance')
  }, [])

  return {
    dashboard,
    loading,
    error,
    retry: loadDashboard,
    queryText,
    setQueryText,
    activeFilters,
    setActiveFilters,
    setFilter,
    sortBy,
    setSortBy,
    searchResults,
    isSearchActive: debouncedText.trim().length > 0 || Object.values(activeFilters).some((v) => v?.length > 0),
    selectedDocument,
    relatedDocuments,
    isDrawerOpen,
    openDocument,
    closeDocument,
    toggleBookmark,
    downloadDocument,
    shareDocument,
    applyPreset,
    resetFilters,
  }
}
