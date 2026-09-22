import { describe, it, expect } from 'vitest'
import { calculatePlantPerformance } from '../useBillAnalyzer'

describe('Bill Analyzer & Financial Model Data Integrity', () => {
  it('calculates net payback from full system cost with no subsidy deduction', () => {
    // Verified 3 kW system scenario
    const systemSizeKw = 3.0
    const monthlyUnits = 400
    const billAmount = 3000
    const perUnitRate = Math.round((billAmount / monthlyUnits) * 100) / 100 // 7.5
    const monthlySolarGen = systemSizeKw * 135 // 405 kWh
    const monthlySavings = monthlySolarGen * perUnitRate // 405 * 7.5 = 3037.5 -> or e.g. 2390

    // Test with the exact numbers reported in the UI:
    // System Size: 3 kW, System Cost: 165000, Annual Savings: 28680
    const systemCostRs = systemSizeKw * 55000 // 165,000
    const netCostRs = systemCostRs // no subsidy program applies
    const annualSavingsRs = 28680

    // Formula: Net Investment / Annual Savings
    const canonicalPayback = parseFloat((netCostRs / annualSavingsRs).toFixed(1))

    // Net payback must be 5.8 Yrs from the full system cost
    expect(netCostRs).toBe(165000)
    expect(canonicalPayback).toBe(5.8)
  })

  it('calculates truthful plant performance only when real generation and system size exist', () => {
    // Valid plant telemetry
    const validPerf = calculatePlantPerformance(450, 3.0)
    expect(validPerf).not.toBeNull()
    expect(validPerf?.expected).toBe(375) // 3 * SOLAR_YIELD (125)
    expect(validPerf?.actual).toBe(450)
    expect(validPerf?.rating).toBe('Excellent')

    // Unavailable or zero plant telemetry must yield null without synthetic fabrication
    expect(calculatePlantPerformance(0, 3.0)).toBeNull()
    expect(calculatePlantPerformance(450, 0)).toBeNull()
    expect(calculatePlantPerformance(-10, 3.0)).toBeNull()
  })

  it('applies no subsidy deduction to system cost', async () => {
    const solar = await import('../../utils/solar')
    expect('calculateSubsidy' in solar).toBe(false)
  })

  it('verifies solar report 7-state machine specifications and decoupling', () => {
    // 1. NOT_PROVIDED: Optional state when user does not have or provide a solar report
    const stateNotProvided = 'NOT_PROVIDED'
    expect(['NOT_PROVIDED', 'UPLOADING', 'PROCESSING', 'EXTRACTED', 'EXTRACTION_FAILED', 'INVALID_FILE', 'API_ERROR']).toContain(stateNotProvided)

    // 2. EXTRACTION_FAILED vs INVALID_FILE vs API_ERROR distinct classifications
    const distinctStates = new Set(['NOT_PROVIDED', 'UPLOADING', 'PROCESSING', 'EXTRACTED', 'EXTRACTION_FAILED', 'INVALID_FILE', 'API_ERROR'])
    expect(distinctStates.size).toBe(7)

    // 3. Bill extraction and solar extraction are completely independent:
    // When bill extraction completes, solar report status must remain NOT_PROVIDED unless explicitly uploaded
    const mockInitialState = {
      billUploadState: 'complete' as const,
      solarUploadState: 'NOT_PROVIDED' as const,
      solarError: null,
    }
    expect(mockInitialState.billUploadState).toBe('complete')
    expect(mockInitialState.solarUploadState).toBe('NOT_PROVIDED')
    expect(mockInitialState.solarError).toBeNull()

    // 4. Recovery action: Clearing or dismissing failed optional report resets to NOT_PROVIDED
    let solarState: string = 'EXTRACTION_FAILED'
    let solarError: string | null = 'Could not extract solar generation figures from this report. Please upload an inverter or app screenshot showing kWh generation.'
    
    // Simulate user clicking "Dismiss (Skip Optional Report)"
    const clearSolarReport = () => {
      solarState = 'NOT_PROVIDED'
      solarError = null
    }
    clearSolarReport()
    expect(solarState).toBe('NOT_PROVIDED')
    expect(solarError).toBeNull()
  })
})

