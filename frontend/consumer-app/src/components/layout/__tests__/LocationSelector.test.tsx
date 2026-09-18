import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import LocationSelector from '../LocationSelector'
import * as geocodingService from '../../../services/geocoding.service'
import { readUserStorage, writeUserStorage, getUserStorageKey } from '../../../utils/userStorage'

// Mock geocoding service
vi.mock('../../../services/geocoding.service', () => ({
  reverseGeocode: vi.fn(),
}))

describe('LocationSelector — Automatic Detection & User-Scoped Isolation', () => {
  const mockUserA = { id: 'usr-a-111', email: 'usera@example.com' }
  const mockUserB = { id: 'usr-b-222', email: 'userb@example.com' }

  let originalGeolocation: Geolocation | undefined

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()

    originalGeolocation = navigator.geolocation
  })

  afterEach(() => {
    if (originalGeolocation) {
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
      })
    }
  })

  it('A. New customer + permission granted: automatically detects location, reverse geocodes to City/State, and updates header', async () => {
    const mockGetCurrentPosition = vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 26.8467,
          longitude: 80.9462,
        },
      })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    })

    vi.mocked(geocodingService.reverseGeocode).mockResolvedValueOnce({
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      formatted: 'Lucknow, Uttar Pradesh',
    })

    renderWithProviders(<LocationSelector user={mockUserA} />)

    // Initially shows detecting state
    expect(screen.getByText('Detecting location...')).toBeInTheDocument()

    // Resolves to Lucknow, Uttar Pradesh
    await waitFor(() => {
      expect(screen.getByText('Lucknow, Uttar Pradesh')).toBeInTheDocument()
    })

    // Persisted to User A's scoped storage
    const stored = readUserStorage<string>('current_location', mockUserA)
    expect(stored).toBe('Lucknow, Uttar Pradesh')
  })

  it('B. New customer + permission denied: shows non-blocking fallback and allows manual selection', async () => {
    const mockGetCurrentPosition = vi.fn().mockImplementation((_success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation prompt',
      })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    })

    renderWithProviders(<LocationSelector user={mockUserA} />)

    // Finishes detecting and falls back to Location Not Set
    await waitFor(() => {
      expect(screen.getByText('Location Not Set')).toBeInTheDocument()
    })

    // Open dropdown
    const locationBtn = screen.getByRole('button', { name: /Select location/i })
    fireEvent.click(locationBtn)

    // Non-blocking fallback banner is displayed
    expect(
      screen.getByText('Automatic location access is unavailable. Select a saved location or add one manually.')
    ).toBeInTheDocument()

    // Can manually select Jaipur from saved locations
    const jaipurOption = screen.getByRole('option', { name: /Jaipur, Rajasthan/i })
    fireEvent.click(jaipurOption)

    // Updates header immediately
    expect(screen.getByText('Jaipur, Rajasthan')).toBeInTheDocument()
    expect(readUserStorage<string>('current_location', mockUserA)).toBe('Jaipur, Rajasthan')
  })

  it('C. Returning customer with saved location: immediately displays location without requesting geolocation', async () => {
    // Pre-populate User A location
    writeUserStorage('current_location', 'Noida, Uttar Pradesh', mockUserA)

    const mockGetCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    })

    renderWithProviders(<LocationSelector user={mockUserA} />)

    // Immediately shows Noida without detecting
    expect(screen.getByText('Noida, Uttar Pradesh')).toBeInTheDocument()
    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
  })

  it('D. Use Current Location: genuinely attempts geolocation and updates location on success', async () => {
    // Pre-populate with Jaipur
    writeUserStorage('current_location', 'Jaipur, Rajasthan', mockUserA)

    const mockGetCurrentPosition = vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 19.0760,
          longitude: 72.8777,
        },
      })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    })

    vi.mocked(geocodingService.reverseGeocode).mockResolvedValueOnce({
      city: 'Mumbai',
      state: 'Maharashtra',
      formatted: 'Mumbai, Maharashtra',
    })

    renderWithProviders(<LocationSelector user={mockUserA} />)

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /Select location/i }))

    // Click Use Current Location
    const useCurrentBtn = screen.getByRole('button', { name: /Use Current Location/i })
    fireEvent.click(useCurrentBtn)

    await waitFor(() => {
      expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument()
    })

    expect(readUserStorage<string>('current_location', mockUserA)).toBe('Mumbai, Maharashtra')
  })

  it('E. Reverse geocoding failure: displays honest error without fabricating fake location', async () => {
    writeUserStorage('current_location', 'Jaipur, Rajasthan', mockUserA)

    const mockGetCurrentPosition = vi.fn().mockImplementation((success) => {
      success({
        coords: { latitude: 0, longitude: 0 },
      })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    })

    // Reverse geocode returns null (cannot resolve city/state)
    vi.mocked(geocodingService.reverseGeocode).mockResolvedValueOnce(null)

    renderWithProviders(<LocationSelector user={mockUserA} />)

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /Select location/i }))

    // Click Use Current Location
    fireEvent.click(screen.getByRole('button', { name: /Use Current Location/i }))

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't determine your city automatically. Please select your location manually.")
      ).toBeInTheDocument()
    })

    // Did NOT invent a fake location; stays Jaipur in header
    expect(document.getElementById('currentLocation')).toHaveTextContent('Jaipur, Rajasthan')
  })

  it('F, G, H, I. Add New Location: closes dropdown, opens centered modal, handles cancel, escape, and save', async () => {
    // Pre-populate with Delhi so automatic geolocation is not triggered
    writeUserStorage('current_location', 'New Delhi, Delhi', mockUserA)

    renderWithProviders(<LocationSelector user={mockUserA} />)

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /Select location/i }))

    // Click Add New Location
    const addBtn = screen.getByRole('button', { name: /Add New Location/i })
    fireEvent.click(addBtn)

    // Dropdown listbox must close
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    // Centered modal dialog must appear
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Add New Location')).toBeInTheDocument()

    // Test Cancel
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Reopen modal and test Escape key
    fireEvent.click(screen.getByRole('button', { name: /Select location/i }))
    fireEvent.click(screen.getByRole('button', { name: /Add New Location/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Reopen modal and save new location
    fireEvent.click(screen.getByRole('button', { name: /Select location/i }))
    fireEvent.click(screen.getByRole('button', { name: /Add New Location/i }))

    const cityInput = screen.getByPlaceholderText('e.g. Lucknow')
    const stateInput = screen.getByPlaceholderText('e.g. Uttar Pradesh')

    fireEvent.change(cityInput, { target: { value: 'Varanasi' } })
    fireEvent.change(stateInput, { target: { value: 'Uttar Pradesh' } })

    const saveBtn = screen.getByRole('button', { name: /Save & Select/i })
    fireEvent.click(saveBtn)

    // Dialog closes and header updates to Varanasi, Uttar Pradesh
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Varanasi, Uttar Pradesh')).toBeInTheDocument()

    // Persisted to storage
    expect(readUserStorage<string>('current_location', mockUserA)).toBe('Varanasi, Uttar Pradesh')
  })

  it('K. Customer A vs Customer B isolation: user locations are strictly isolated', () => {
    // Write User A location
    writeUserStorage('current_location', 'Bengaluru, Karnataka', mockUserA)

    // User B storage must be empty
    const userBLocation = readUserStorage<string>('current_location', mockUserB)
    expect(userBLocation).toBeNull()

    // Verify storage keys are distinct
    const keyA = getUserStorageKey('current_location', mockUserA)
    const keyB = getUserStorageKey('current_location', mockUserB)
    expect(keyA).not.toBe(keyB)
  })
})
