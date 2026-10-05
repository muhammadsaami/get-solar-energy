import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import {
  validateSolarProductionInput,
  formatPeriodSummary,
  type ManualSolarFormState,
} from '../../utils/solarProductionValidation'
import { ManualSolarProductionModal } from '../../components/solar/ManualSolarProductionModal'
import { useBillAnalyzer } from '../useBillAnalyzer'
import { getUserStorageKey } from '../../utils/userStorage'

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('../../services/api/client', () => ({
  default: { get: (...a: any[]) => mockGet(...a), post: (...a: any[]) => mockPost(...a) },
}))

const mockTokenGetUser = vi.fn()
vi.mock('../../services/auth/tokenManager', () => ({
  tokenManager: { getUser: (...a: any[]) => mockTokenGetUser(...a) },
}))

const TEST_USER = { id: 'cust-77', email: 'cust77@test.com' }

describe('Phase 7A: Solar Production Manual Entry & Reporting Period', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockTokenGetUser.mockReturnValue(TEST_USER)
    mockGet.mockResolvedValue({ data: { success: true, quota: { upload: { remaining: 3, limit: 3 } } } })
  })

  describe('Validation & Formatting Unit Tests', () => {
    it('rejects empty or non-numeric production kWh', () => {
      const state: ManualSolarFormState = {
        periodType: 'month',
        productionKwh: '',
        installedCapacityKwp: '3.5',
        date: '',
        weekStartDate: '',
        weekEndDate: '',
        month: 'March',
        year: '2026',
        lifetimeAsOfDate: '',
        customStartDate: '',
        customEndDate: '',
        dailyPoints: [],
      }
      const res = validateSolarProductionInput(state)
      expect(res.isValid).toBe(false)
      expect(res.errors.productionKwh).toContain('required')
    })

    it('rejects negative production kWh', () => {
      const state: ManualSolarFormState = {
        periodType: 'month',
        productionKwh: '-50',
        installedCapacityKwp: '3.5',
        date: '',
        weekStartDate: '',
        weekEndDate: '',
        month: 'March',
        year: '2026',
        lifetimeAsOfDate: '',
        customStartDate: '',
        customEndDate: '',
        dailyPoints: [],
      }
      const res = validateSolarProductionInput(state)
      expect(res.isValid).toBe(false)
      expect(res.errors.productionKwh).toContain('cannot be negative')
    })

    it('rejects negative system capacity if entered', () => {
      const state: ManualSolarFormState = {
        periodType: 'month',
        productionKwh: '320',
        installedCapacityKwp: '-2',
        date: '',
        weekStartDate: '',
        weekEndDate: '',
        month: 'March',
        year: '2026',
        lifetimeAsOfDate: '',
        customStartDate: '',
        customEndDate: '',
        dailyPoints: [],
      }
      const res = validateSolarProductionInput(state)
      expect(res.isValid).toBe(false)
      expect(res.errors.installedCapacityKwp).toContain('greater than 0')
    })

    it('rejects invalid custom range where startDate > endDate', () => {
      const state: ManualSolarFormState = {
        periodType: 'custom',
        productionKwh: '150',
        installedCapacityKwp: '',
        date: '',
        weekStartDate: '',
        weekEndDate: '',
        month: '',
        year: '',
        lifetimeAsOfDate: '',
        customStartDate: '2026-03-20',
        customEndDate: '2026-03-10',
        dailyPoints: [],
      }
      const res = validateSolarProductionInput(state)
      expect(res.isValid).toBe(false)
      expect(res.errors.endDate).toContain('Start date cannot be after end date')
    })

    it('accepts valid month period input and calculates daily generation', () => {
      const state: ManualSolarFormState = {
        periodType: 'month',
        productionKwh: '300',
        installedCapacityKwp: '3.0',
        date: '',
        weekStartDate: '',
        weekEndDate: '',
        month: 'March',
        year: '2026',
        lifetimeAsOfDate: '',
        customStartDate: '',
        customEndDate: '',
        dailyPoints: [],
      }
      const res = validateSolarProductionInput(state)
      expect(res.isValid).toBe(true)
      expect(res.data?.productionKwh).toBe(300)
      expect(res.data?.systemSizeKw).toBe(3.0)
      expect(res.data?.dailyGenerationKwh).toBe(10)
      expect(res.data?.source).toBe('manual')
    })

    it('correctly formats period summaries across all period types', () => {
      expect(formatPeriodSummary({ periodType: 'day', startDate: '2026-03-15' })).toContain('Day')
      expect(formatPeriodSummary({ periodType: 'month', month: 'March', year: 2026 })).toBe('Month · March 2026')
      expect(formatPeriodSummary({ periodType: 'year', year: 2026 })).toBe('Year · 2026')
      expect(formatPeriodSummary({ periodType: 'lifetime' })).toContain('Lifetime')
      expect(formatPeriodSummary({ periodType: 'custom', startDate: '2026-03-01', endDate: '2026-03-15' })).toContain('2026')
    })
  })

  describe('ManualSolarProductionModal Component Flow', () => {
    it('renders with all period types, allows entering data, reviews, and saves', async () => {
      const onSave = vi.fn()
      const onClose = vi.fn()

      const { container } = render(<ManualSolarProductionModal isOpen={true} onClose={onClose} onSave={onSave} />)

      expect(screen.getByText('Enter Solar Production Readings')).toBeTruthy()
      expect(screen.getByRole('radio', { name: 'Month' })).toBeTruthy()
      expect(screen.getByRole('radio', { name: 'Day' })).toBeTruthy()
      expect(screen.getByRole('radio', { name: 'Week' })).toBeTruthy()
      expect(screen.getByRole('radio', { name: 'Year' })).toBeTruthy()
      expect(screen.getByRole('radio', { name: 'Lifetime' })).toBeTruthy()
      expect(screen.getByRole('radio', { name: 'Custom Range' })).toBeTruthy()

      // Fill in production reading
      const kwhInput = container.querySelector('#manualSolarProductionInput') as HTMLInputElement
      expect(kwhInput).not.toBeNull()
      fireEvent.change(kwhInput, { target: { value: '385.5' } })

      // Fill in optional system capacity
      const capInput = container.querySelector('#manualSolarCapacityInput') as HTMLInputElement
      expect(capInput).not.toBeNull()
      fireEvent.change(capInput, { target: { value: '4.2' } })

      // Proceed to review
      const reviewBtn = container.querySelector('#btnReviewSolarReading') as HTMLButtonElement
      expect(reviewBtn).not.toBeNull()
      fireEvent.click(reviewBtn)

      // Verify review state displays entered metrics
      await waitFor(() => {
        expect(screen.getByText('Review Solar Reading')).toBeTruthy()
      })
      expect(screen.getByText('385.50 kWh')).toBeTruthy()
      expect(screen.getByText('4.20 kWp')).toBeTruthy()
      expect(screen.getByText('Manual Entry')).toBeTruthy()

      // Save reading
      const saveBtn = container.querySelector('#btnSaveManualReading') as HTMLButtonElement
      expect(saveBtn).not.toBeNull()
      fireEvent.click(saveBtn)

      expect(onSave).toHaveBeenCalledTimes(1)
      const savedData = onSave.mock.calls[0][0]
      expect(savedData.productionKwh).toBe(385.5)
      expect(savedData.systemSizeKw).toBe(4.2)
      expect(savedData.source).toBe('manual')
      expect(savedData.periodType).toBe('month')
    })

    it('allows navigating back from review to edit details without losing data', async () => {
      const onSave = vi.fn()
      const { container } = render(<ManualSolarProductionModal isOpen={true} onClose={vi.fn()} onSave={onSave} />)

      const kwhInput = container.querySelector('#manualSolarProductionInput') as HTMLInputElement
      expect(kwhInput).not.toBeNull()
      fireEvent.change(kwhInput, { target: { value: '420' } })

      const reviewBtn = container.querySelector('#btnReviewSolarReading') as HTMLButtonElement
      fireEvent.click(reviewBtn)

      await waitFor(() => {
        expect(screen.getByText('Review Solar Reading')).toBeTruthy()
      })

      // Click Edit Details
      const editBtn = container.querySelector('#btnEditManualReading') as HTMLButtonElement
      expect(editBtn).not.toBeNull()
      fireEvent.click(editBtn)

      await waitFor(() => {
        expect(screen.getByText('Enter Solar Production Readings')).toBeTruthy()
      })
      const recheckedInput = container.querySelector('#manualSolarProductionInput') as HTMLInputElement
      expect(recheckedInput.value).toBe('420')
    })
  })

  describe('useBillAnalyzer Integration', () => {
    it('saveManualSolar updates solarReport state and isolates production from consumption', async () => {
      const { result } = renderHook(() => useBillAnalyzer())

      act(() => {
        result.current.saveManualSolar({
          productionKwh: 350,
          systemSizeKw: 3.5,
          periodType: 'month',
          month: 'March',
          year: '2026',
          source: 'manual',
          dailyGenerationKwh: 11.3,
        })
      })

      expect(result.current.solarReport).not.toBeNull()
      expect(result.current.solarReport?.productionKwh).toBe(350)
      expect(result.current.solarReport?.systemSizeKw).toBe(3.5)
      expect(result.current.solarReport?.source).toBe('manual')
      expect(result.current.solarUploadState).toBe('EXTRACTED')

      // Verify strict isolation: solar production must NOT pollute bill consumption
      expect(result.current.analysis).toBeNull()

      // Verify persistence under customer storage key and lastSolarProduction
      const userKey = getUserStorageKey('lastSolarProduction', TEST_USER)
      const persistedUser = localStorage.getItem(userKey)
      expect(persistedUser).not.toBeNull()
      expect(JSON.parse(persistedUser!).productionKwh).toBe(350)

      const persistedCanonical = localStorage.getItem('lastSolarProduction')
      expect(persistedCanonical).not.toBeNull()
      expect(JSON.parse(persistedCanonical!).source).toBe('manual')
    })
  })
})
