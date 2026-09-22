import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAMC } from '../hooks/useAMC'

const mockFetchAll = vi.fn().mockResolvedValue({ contract: null, errors: {} })
const mockFetchRec = vi.fn()

vi.mock('../services/amc.service', () => ({
  fetchAllAMCSources: (...a: any[]) => mockFetchAll(...a),
  fetchAMCRecommendation: (...a: any[]) => mockFetchRec(...a),
  getDefaultRecommendationRequest: () => ({}),
  invalidateAMCCache: vi.fn(),
}))

vi.mock('../../services/auth/tokenManager', () => ({
  tokenManager: { getUser: () => ({ id: 'amc-val-user', email: 'v@amc.test' }) },
}))

vi.mock('../../utils/referral', async () => {
  const actual = await vi.importActual('../../utils/referral')
  return {
    ...actual,
    getUser: () => ({ id: 'amc-val-user', email: 'v@amc.test', name: 'V', referral_code: 'V1' }),
  }
})

describe('useAMC request validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchAll.mockResolvedValue({ contract: null, errors: {} })
  })

  it('blocks generation when size/date are missing without calling the API', async () => {
    const { result } = renderHook(() => useAMC())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    await act(async () => {
      await result.current.getRecommendation({ system_size_kw: 0, installation_date: '' } as any)
    })
    expect(mockFetchRec).not.toHaveBeenCalled()
    expect(result.current.error?.message).toMatch(/system size and installation date/i)
  })

  it('treats a backend fallback/demo estimate as an honest error, never real data', async () => {
    mockFetchRec.mockResolvedValue({
      success: true,
      fallback: true,
      data: { customer_name: 'Demo Customer', system_size_kw: 5, health_score: 78 },
    })
    const { result } = renderHook(() => useAMC())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    await act(async () => {
      await result.current.getRecommendation({ system_size_kw: 5, installation_date: '2024-06-01' } as any)
    })
    expect(result.current.recommendation).toBeNull()
    expect(result.current.error?.message).toMatch(/temporarily unavailable/i)
  })

  it('proceeds with honest values when size/date are present', async () => {
    mockFetchRec.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useAMC())
    await act(async () => {
      await result.current.getRecommendation({ system_size_kw: 5, installation_date: '2024-06-01' } as any)
    })
    expect(mockFetchRec).toHaveBeenCalled()
    const sent = mockFetchRec.mock.calls[0][0]
    expect(sent.system_size_kw).toBe(5)
    expect(sent.installation_date).toBe('2024-06-01')
  })
})
