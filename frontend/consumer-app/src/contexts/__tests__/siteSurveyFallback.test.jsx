import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SiteSurveyProvider, useSiteSurvey } from '../SiteSurveyContext'

const mockRunAi = vi.fn()
const mockUpdateSurvey = vi.fn()
const mockUpdateStatus = vi.fn()
vi.mock('../../services/siteSurvey.service', () => ({
  siteSurveyService: {
    getDashboard: vi.fn().mockResolvedValue({}),
    listSurveys: vi.fn().mockResolvedValue({ data: [], pagination: {} }),
    getSurvey: vi.fn(),
    createSurvey: vi.fn(),
    updateSurvey: (...a) => mockUpdateSurvey(...a),
    updateStatus: (...a) => mockUpdateStatus(...a),
    assignSurveyor: vi.fn(),
    runAiFeasibility: (...a) => mockRunAi(...a),
  },
}))

vi.mock('../JourneyContext', () => ({
  useJourney: () => ({ updateStage: vi.fn() }),
}))

function renderSurveyHook() {
  return renderHook(() => useSiteSurvey(), {
    wrapper: ({ children }) => <SiteSurveyProvider>{children}</SiteSurveyProvider>,
  })
}

describe('Site Survey AI fallback honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fallback:true result becomes an honest error and is never promoted', async () => {
    mockRunAi.mockResolvedValue({
      success: true,
      fallback: true,
      data: { customer_name: 'Demo Customer', feasibility_score: 85 },
    })
    const { result } = renderSurveyHook()
    let outcome
    await act(async () => {
      outcome = await result.current.runAiFeasibility({ customer_name: 'Real User' })
    })
    expect(outcome.success).toBe(false)
    expect(outcome.error).toMatch(/temporarily unavailable/i)
    expect(mockUpdateSurvey).not.toHaveBeenCalled()
    expect(mockUpdateStatus).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.error).toMatch(/temporarily unavailable/i)
    })
  })

  it('real AI result still passes through to the caller', async () => {
    mockRunAi.mockResolvedValue({ success: true, data: { feasibility_score: 90 } })
    const { result } = renderSurveyHook()
    let outcome
    await act(async () => {
      outcome = await result.current.runAiFeasibility({ customer_name: 'Real User' })
    })
    expect(outcome).toEqual({ success: true, data: { feasibility_score: 90 } })
  })
})
