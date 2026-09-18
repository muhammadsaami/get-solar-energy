import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { readUserStorage, writeUserStorage } from '../../utils/userStorage'
import { reverseGeocode } from '../../services/geocoding.service'

const DEFAULT_LOCATIONS = [
  'Lucknow, Uttar Pradesh',
  'Jaipur, Rajasthan',
  'Noida, Uttar Pradesh',
  'New Delhi, Delhi',
  'Bengaluru, Karnataka',
  'Mumbai, Maharashtra',
  'Ahmedabad, Gujarat',
]

interface AuthUser {
  id?: string | number | null
  email?: string | null
  name?: string | null
}

interface LocationSelectorProps {
  user?: AuthUser | null
}

export default function LocationSelector({ user: propUser }: LocationSelectorProps = {}) {
  // ── Always call useAuth unconditionally (React Rules of Hooks) ──────────
  // We need to call useAuth at the top level always. We'll try/catch the
  // context value access, but the hook itself must not be conditional.
  let contextUser: AuthUser | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth() as unknown as { user: AuthUser | null }
    contextUser = auth?.user ?? null
  } catch {
    // Outside AuthProvider — graceful degradation
  }

  // Resolve effective user: prop overrides context (used in tests)
  let user: AuthUser | null = propUser ?? contextUser

  // Final fallback: read from localStorage if no user from context/prop
  if (!user && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('get-solar-energy.auth.user')
      if (raw) user = JSON.parse(raw)
    } catch {
      // Ignored
    }
  }

  // ── Component State ─────────────────────────────────────────────────────
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [savedLocations, setSavedLocations] = useState<string[]>(DEFAULT_LOCATIONS)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoNotice, setGeoNotice] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  // Add Location Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Effect 1: Automatic Location Detection on Mount ──────────────────────
  useEffect(() => {
    // Load user's saved locations
    const existingSaved = readUserStorage<string[]>('saved_locations', user)
    if (existingSaved && Array.isArray(existingSaved) && existingSaved.length > 0) {
      setSavedLocations(existingSaved)
    } else {
      setSavedLocations(DEFAULT_LOCATIONS)
    }

    // If user already has a current location, display it immediately — no geolocation needed
    const existing = readUserStorage<string>('current_location', user)
    if (existing && typeof existing === 'string' && existing.trim()) {
      setSelectedLocation(existing.trim())
      setIsDetecting(false)
      return
    }

    // No current location: initiate automatic browser geolocation
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoNotice(
        'Automatic location access is unavailable. Select a saved location or add one manually.'
      )
      setIsDetecting(false)
      return
    }

    // Prevent repeated permission prompts within the same browser session after denial
    const sessionKey = `gse_geo_attempted_${user?.id || user?.email || 'anon'}`
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(sessionKey) === 'denied'
    ) {
      setGeoNotice(
        'Automatic location access is unavailable. Select a saved location or add one manually.'
      )
      setIsDetecting(false)
      return
    }

    // Start detecting — show "Detecting location..." in the topbar
    setIsDetecting(true)
    setGeoError(null)
    setGeoNotice(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await reverseGeocode(latitude, longitude)
          if (res && res.formatted) {
            setSelectedLocation(res.formatted)
            writeUserStorage('current_location', res.formatted, user)

            // Prepend to saved locations if not already present
            const currentSaved =
              readUserStorage<string[]>('saved_locations', user) || DEFAULT_LOCATIONS
            if (!currentSaved.includes(res.formatted)) {
              const updated = [res.formatted, ...currentSaved]
              setSavedLocations(updated)
              writeUserStorage('saved_locations', updated, user)
            }
            setGeoError(null)
            setGeoNotice(null)
          } else {
            setGeoNotice(
              "Couldn't determine your city automatically. Please select your location manually."
            )
          }
        } catch {
          setGeoNotice(
            "Couldn't determine your city automatically. Please select your location manually."
          )
        } finally {
          setIsDetecting(false)
        }
      },
      (err) => {
        setIsDetecting(false)
        // Record denial so we don't repeatedly prompt in this session
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(sessionKey, 'denied')
        }
        if (err && err.code === 1 /* PERMISSION_DENIED */) {
          setGeoNotice(
            'Automatic location access is unavailable. Select a saved location or add one manually.'
          )
        } else {
          setGeoNotice(
            'Automatic location detection was unable to determine your location. Select a saved location or add one manually.'
          )
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email])

  // ── Effect 2: Click-outside to close dropdown ────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // ── Effect 3: Escape key handler ─────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isAddModalOpen) {
          setIsAddModalOpen(false)
        } else if (isOpen) {
          setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAddModalOpen, isOpen])

  // ── Effect 4: Focus search input when dropdown opens ─────────────────────
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    if (!isOpen) {
      setSearchQuery('')
      setGeoError(null)
    }
  }, [isOpen])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectLocation = (loc: string) => {
    setSelectedLocation(loc)
    writeUserStorage('current_location', loc, user)
    setIsDetecting(false)
    setIsOpen(false)
    setGeoError(null)
    setGeoNotice(null)
  }

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const res = await reverseGeocode(lat, lon)
          if (res && res.formatted) {
            handleSelectLocation(res.formatted)

            const currentSaved =
              readUserStorage<string[]>('saved_locations', user) || DEFAULT_LOCATIONS
            if (!currentSaved.includes(res.formatted)) {
              const updated = [res.formatted, ...currentSaved]
              setSavedLocations(updated)
              writeUserStorage('saved_locations', updated, user)
            }
          } else {
            setGeoError(
              "Couldn't determine your city automatically. Please select your location manually."
            )
          }
        } catch {
          setGeoError(
            "Couldn't determine your city automatically. Please select your location manually."
          )
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        setIsLocating(false)
        if (err && err.code === 1 /* PERMISSION_DENIED */) {
          setGeoError(
            'Location access was denied. Please allow location access in your browser or select manually.'
          )
        } else {
          setGeoError('Unable to retrieve your current location. Please select manually.')
        }
      },
      { timeout: 10000 }
    )
  }

  const handleSaveNewLocation = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCity = newCity.trim()
    const trimmedState = newState.trim()

    if (!trimmedCity || !trimmedState) {
      setAddError('Please provide both City and State.')
      return
    }

    const formatted = `${trimmedCity}, ${trimmedState}`
    const updated = savedLocations.includes(formatted)
      ? savedLocations
      : [formatted, ...savedLocations]

    setSavedLocations(updated)
    writeUserStorage('saved_locations', updated, user)
    handleSelectLocation(formatted)

    setNewCity('')
    setNewState('')
    setAddError(null)
    setIsAddModalOpen(false)
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const filteredLocations = savedLocations.filter((loc) =>
    loc.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  let displayLabel = 'Location Not Set'
  if (isDetecting) {
    displayLabel = 'Detecting location...'
  } else if (selectedLocation) {
    displayLabel = selectedLocation
  }

  // ── Add New Location Modal — rendered via portal to escape stacking context
  const addLocationModal = isAddModalOpen
    ? createPortal(
        <div
          data-testid="add-location-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="addLocationTitle"
            style={{
              backgroundColor: 'var(--bg-card, #0a192f)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: '14px',
              padding: '24px',
              width: '100%',
              maxWidth: '380px',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7)',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                id="addLocationTitle"
                style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}
              >
                Add New Location
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #8892b0)',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSaveNewLocation}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {addError && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#f87171',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  {addError}
                </div>
              )}

              <div>
                <label
                  htmlFor="newCityInput"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    marginBottom: '6px',
                  }}
                >
                  City
                </label>
                <input
                  id="newCityInput"
                  type="text"
                  placeholder="e.g. Lucknow"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="newStateInput"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    marginBottom: '6px',
                  }}
                >
                  State
                </label>
                <input
                  id="newStateInput"
                  type="text"
                  placeholder="e.g. Uttar Pradesh"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-secondary, #cbd5e1)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-orange, #f7931e)',
                    border: 'none',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={dropdownRef}
        className={`location-selector topbar-workspace-chip ${isOpen ? 'active' : ''}`}
        id="locationSelector"
        style={{ position: 'relative' }}
      >
        <style>{`@keyframes gse-spin { to { transform: rotate(360deg); } }`}</style>

        {/* ── Topbar Button ── */}
        <button
          className="location-btn"
          id="locationBtn"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Select location. Current: ${displayLabel}`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isDetecting ? (
            <svg
              className="pin detecting-spinner"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00aeef"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, animation: 'gse-spin 1s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <svg
              className="pin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
          <span id="currentLocation" className="location-btn-text" title={displayLabel}>
            {displayLabel}
          </span>
          <svg
            className="chevron"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* ── Dropdown Popover ── */}
        {isOpen && (
          <div
            className="location-dropdown-popover"
            role="listbox"
            aria-label="Locations list"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              maxWidth: 'calc(100vw - 32px)',
              backgroundColor: 'var(--bg-card, #0a192f)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '12px',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '12px',
              zIndex: 110,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Header */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--text-muted, #8892b0)',
                padding: '0 4px',
              }}
            >
              Select Your Location
            </div>

            {/* Search Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ color: 'var(--text-muted, #8892b0)', flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '12px',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #8892b0)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Geo Notice Banner — non-blocking fallback when permission denied / geocoding fails */}
            {geoNotice && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#93c5fd',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.22)',
                  lineHeight: '1.35',
                }}
              >
                {geoNotice}
              </div>
            )}

            {/* Geo Error Banner — shown after explicit "Use Current Location" failure */}
            {geoError && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#f87171',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.22)',
                  lineHeight: '1.35',
                }}
              >
                {geoError}
              </div>
            )}

            {/* Saved Locations */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary, #cbd5e1)',
                padding: '2px 4px 0',
              }}
            >
              Saved Locations
            </div>

            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {filteredLocations.length === 0 ? (
                <div
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'var(--text-muted, #8892b0)',
                  }}
                >
                  No matching locations
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const isSelected = selectedLocation === loc
                  return (
                    <button
                      key={loc}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectLocation(loc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(247, 147, 30, 0.12)' : 'transparent',
                        border: isSelected
                          ? '1px solid rgba(247, 147, 30, 0.3)'
                          : '1px solid transparent',
                        color: isSelected
                          ? 'var(--accent-orange, #f7931e)'
                          : 'var(--text-primary, #e2e8f0)',
                        fontSize: '12px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          color: isSelected
                            ? 'var(--accent-orange, #f7931e)'
                            : 'var(--text-muted, #8892b0)',
                          flexShrink: 0,
                        }}
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {loc}
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                margin: '2px 0',
              }}
            />

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                id="useCurrentLocationBtn"
                disabled={isLocating}
                onClick={handleUseCurrentLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary, #e2e8f0)',
                  fontSize: '12px',
                  cursor: isLocating ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: isLocating ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ color: 'var(--accent-blue, #00aeef)', flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
                <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
              </button>

              <button
                type="button"
                id="addNewLocationBtn"
                onClick={() => {
                  // Dropdown MUST close completely before modal opens
                  setIsOpen(false)
                  setNewCity('')
                  setNewState('')
                  setAddError(null)
                  setIsAddModalOpen(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary, #e2e8f0)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ color: 'var(--accent-green, #10b981)', flexShrink: 0 }}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Location</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Location Modal: rendered via createPortal into document.body ──
          This breaks out of any ancestor stacking context (transform, filter,
          will-change, etc.) that would clip position:fixed children. The modal
          is always centered in the true viewport.                              */}
      {addLocationModal}
    </>
  )
}
