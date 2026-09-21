import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useROICalculator } from '../useROICalculator'
import ROICalculatorPage from '../../pages/ROICalculatorPage'
import { tokenManager } from '../../services/auth/tokenManager'
import * as roiService from '../../services/roi.service'

describe('ROI Calculator — Hardcoded Value Removal & Fresh Customer State', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()

    // Default to a fresh customer with stable ID
    vi.spyOn(tokenManager, 'getUser').mockReturnValue({
      id: 'customer_fresh_101',
      email: 'fresh.customer@getsolar.in',
      role: 'customer',
    })
  })

  it('1. Initializes fresh customer with genuine empty numeric inputs (no 0, 5, or 3)', () => {
    const { result } = renderHook(() => useROICalculator())

    expect(result.current.formData.monthlyBill).toBe('')
    expect(result.current.formData.sunHours).toBe('')
    expect(result.current.formData.systemSize).toBe('')
    // Panel quality is a hardware selection tier, not fake customer data
    expect(result.current.formData.panelQuality).toBe('mono')

    expect(result.current.result).toBeNull()
    expect(result.current.status).toBe('idle')
    expect(result.current.hasCalculated).toBe(false)
  })

  it('2. ROICalculatorPage renders empty inputs with placeholders and no fake defaults', () => {
    render(<ROICalculatorPage />)

    const billInput = screen.getByLabelText(/Current Monthly Electricity Bill/i) as HTMLInputElement
    const sunInput = screen.getByLabelText(/Average Daily Sunlight/i) as HTMLInputElement
    const sizeInput = screen.getByLabelText(/Target System Capacity/i) as HTMLInputElement

    expect(billInput.value).toBe('')
    expect(billInput.placeholder).toBe('e.g. 6500')

    expect(sunInput.value).toBe('')
    expect(sunInput.placeholder).toBe('e.g. 5.0')

    expect(sizeInput.value).toBe('')
    expect(sizeInput.placeholder).toBe('e.g. 3.0')

    // Empty prompt message should be visible before calculation
    expect(screen.getByText(/Personalized ROI Projection/i)).toBeInTheDocument()
  })

  it('3. Prevents calculation when required inputs are empty and displays validation error', async () => {
    const calculateSpy = vi.spyOn(roiService, 'calculateROI')
    const { result } = renderHook(() => useROICalculator())

    await act(async () => {
      await result.current.calculate()
    })

    expect(calculateSpy).not.toHaveBeenCalled()
    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatch(/Please enter your monthly electricity bill and target system capacity/i)
    expect(result.current.result).toBeNull()
  })

  it('4. Allows users to type and clear inputs back to empty string', () => {
    const { result } = renderHook(() => useROICalculator())

    act(() => {
      result.current.setMonthlyBill(7500)
      result.current.setSunHours(5.5)
      result.current.setSystemSize(4)
    })

    expect(result.current.formData.monthlyBill).toBe(7500)
    expect(result.current.formData.sunHours).toBe(5.5)
    expect(result.current.formData.systemSize).toBe(4)

    // User clears back to empty
    act(() => {
      result.current.setMonthlyBill('')
      result.current.setSunHours('')
      result.current.setSystemSize('')
    })

    expect(result.current.formData.monthlyBill).toBe('')
    expect(result.current.formData.sunHours).toBe('')
    expect(result.current.formData.systemSize).toBe('')
  })

  it('5. Computes ROI successfully when valid inputs are provided', async () => {
    const mockApiResponse: roiService.ROIApiResponse = {
      success: true,
      data: {
        recommended_kw: 3.0,
        system_cost: 165000,
        government_subsidy: 78000,
        net_cost: 87000,
        monthly_savings: 5850,
        annual_savings: 70200,
        annual_generation: 4860,
        payback_period: 1.2,
        lifetime_savings: 1668000,
        roiPercentage: 1817.2,
        co2_reduction: 3.99,
      },
    }

    vi.spyOn(roiService, 'calculateROI').mockResolvedValueOnce(mockApiResponse)

    const { result } = renderHook(() => useROICalculator())

    act(() => {
      result.current.setMonthlyBill(6500)
      result.current.setSunHours(5.0)
      result.current.setSystemSize(3.0)
    })

    await act(async () => {
      await result.current.calculate()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.hasCalculated).toBe(true)
    expect(result.current.result).not.toBeNull()
    expect(result.current.result?.netCost).toBe(87000)
    expect(result.current.result?.governmentSubsidy).toBe(78000)
    expect(result.current.chartData.length).toBe(25)
  })

  it('6. Strict customer data isolation: Customer B does not inherit Customer A saved ROI data', async () => {
    // User A calculates and saves
    vi.spyOn(tokenManager, 'getUser').mockReturnValue({
      id: 'customer_A_111',
      email: 'customer.a@getsolar.in',
      role: 'customer',
    })

    const mockApiResponse: roiService.ROIApiResponse = {
      success: true,
      data: {
        recommended_kw: 5.0,
        system_cost: 275000,
        government_subsidy: 78000,
        net_cost: 197000,
        monthly_savings: 9000,
        annual_savings: 108000,
        annual_generation: 8100,
        payback_period: 1.8,
        lifetime_savings: 2503000,
        roiPercentage: 1170.6,
        co2_reduction: 6.64,
      },
    }
    vi.spyOn(roiService, 'calculateROI').mockResolvedValueOnce(mockApiResponse)

    const hookA = renderHook(() => useROICalculator())
    act(() => {
      hookA.result.current.setMonthlyBill(10000)
      hookA.result.current.setSystemSize(5.0)
    })
    await act(async () => {
      await hookA.result.current.calculate()
    })
    expect(hookA.result.current.hasCalculated).toBe(true)

    // Now User B logs in
    vi.spyOn(tokenManager, 'getUser').mockReturnValue({
      id: 'customer_B_222',
      email: 'customer.b@getsolar.in',
      role: 'customer',
    })

    const hookB = renderHook(() => useROICalculator())
    expect(hookB.result.current.formData.monthlyBill).toBe('')
    expect(hookB.result.current.formData.systemSize).toBe('')
    expect(hookB.result.current.formData.sunHours).toBe('')
    expect(hookB.result.current.result).toBeNull()
    expect(hookB.result.current.hasCalculated).toBe(false)
  })

  it('7. Legitimate saved ROI calculation is properly restored for that specific authenticated customer', async () => {
    vi.spyOn(tokenManager, 'getUser').mockReturnValue({
      id: 'customer_existing_333',
      email: 'existing.cust@getsolar.in',
      role: 'customer',
    })

    // Simulate pre-existing verified ROI persistence in user-scoped key
    const savedState = {
      version: 1,
      formData: {
        monthlyBill: 8000,
        sunHours: 5.5,
        systemSize: 4.0,
        panelQuality: 'bifacial',
      },
      result: {
        recommendedKw: 4.0,
        systemCost: 220000,
        governmentSubsidy: 78000,
        netCost: 142000,
        monthlySavings: 7200,
        annualSavings: 86400,
        annualGeneration: 6480,
        paybackPeriod: 1.6,
        lifetimeSavings: 2018000,
        roiPercentage: 1321.1,
        co2Reduction: 5.31,
      },
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem('gse_u_id_customer_existing_333_roiAnalysisState', JSON.stringify(savedState))

    const { result } = renderHook(() => useROICalculator())

    expect(result.current.formData.monthlyBill).toBe(8000)
    expect(result.current.formData.sunHours).toBe(5.5)
    expect(result.current.formData.systemSize).toBe(4.0)
    expect(result.current.formData.panelQuality).toBe('bifacial')
    expect(result.current.result?.netCost).toBe(142000)
    expect(result.current.hasCalculated).toBe(true)
    expect(result.current.status).toBe('success')
  })

  it('8. Reset clears state back to empty form without fake defaults', async () => {
    const { result } = renderHook(() => useROICalculator())

    act(() => {
      result.current.setMonthlyBill(5000)
      result.current.setSystemSize(3.0)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.formData.monthlyBill).toBe('')
    expect(result.current.formData.sunHours).toBe('')
    expect(result.current.formData.systemSize).toBe('')
    expect(result.current.result).toBeNull()
    expect(result.current.hasCalculated).toBe(false)
  })
})
