import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
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

const USER_A = { id: 'user-a-1', email: 'a@test.com' }
const USER_B = { id: 'user-b-2', email: 'b@test.com' }

function billKey(user: any) {
  return getUserStorageKey('lastBillAnalysis', user)
}

function pdfFile(name = 'bill.pdf') {
  return new File(['dummy-bill-content'], name, { type: 'application/pdf' })
}

describe('Bill Analyzer quota + persistence regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockTokenGetUser.mockReturnValue(USER_A)
    mockGet.mockResolvedValue({ data: { success: true, quota: { upload: { remaining: 3, limit: 3 } } } })
  })

  it('selecting a valid bill does not throw and completes analysis', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, data: { monthly_units: 400, bill_amount: 3000 } },
    })
    const { result } = renderHook(() => useBillAnalyzer())
    let threw: unknown = null
    await act(async () => {
      try {
        result.current.handleBillFile(pdfFile())
      } catch (e) {
        threw = e
      }
    })
    expect(threw).toBeNull()
    await waitFor(() => {
      expect(result.current.billUploadState).toBe('complete')
    })
    expect(result.current.analysis).not.toBeNull()
    // Persisted under the user-scoped key (no competing global key)
    expect(localStorage.getItem(billKey(USER_A))).not.toBeNull()
    expect(localStorage.getItem('lastBillAnalysis')).toBeNull()
  })

  it('invalid file type yields error state without throwing', async () => {
    const { result } = renderHook(() => useBillAnalyzer())
    await act(async () => {
      result.current.handleBillFile(new File(['x'], 'bill.txt', { type: 'text/plain' }))
    })
    expect(result.current.billUploadState).toBe('error')
    expect(result.current.billError).toMatch(/valid document/i)
  })

  it('quota request uses the shared authenticated client path', async () => {
    renderHook(() => useBillAnalyzer())
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/analyze-bill/quota')
    })
  })

  it('quota 401 is handled silently: quotas stay null, no throw', async () => {
    mockGet.mockRejectedValue({ response: { status: 401 } })
    const { result } = renderHook(() => useBillAnalyzer())
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled()
    })
    // Allow the silent catch to settle
    await act(async () => {})
    expect(result.current.quotas).toBeNull()
  })

  it('fresh customer has honest empty state', () => {
    const { result } = renderHook(() => useBillAnalyzer())
    expect(result.current.analysis).toBeNull()
    expect(result.current.billUploadState).toBe('idle')
  })

  it('bill state is isolated per customer', async () => {
    localStorage.setItem(billKey(USER_A), JSON.stringify({ monthly_units: 400, bill_amount: 3000 }))
    // User B must not see user A's bill
    mockTokenGetUser.mockReturnValue(USER_B)
    const { result: resB, unmount: unmountB } = renderHook(() => useBillAnalyzer())
    expect(resB.current.analysis).toBeNull()
    unmountB()
    // User A restores their own bill
    mockTokenGetUser.mockReturnValue(USER_A)
    const { result: resA } = renderHook(() => useBillAnalyzer())
    expect(resA.current.analysis).not.toBeNull()
  })

  it('maps net_billed_units from the bill response to state (613)', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, data: { monthly_units: 613, bill_amount: 5200, net_billed_units: 613 } },
    })
    const { result } = renderHook(() => useBillAnalyzer())
    await act(async () => {
      result.current.handleBillFile(pdfFile())
    })
    await waitFor(() => {
      expect(result.current.billUploadState).toBe('complete')
    })
    expect(result.current.analysis?.netBilledUnits).toBe(613)
  })

  it('maps other net_billed_units values without hardcoding', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, data: { monthly_units: 250, bill_amount: 1800, net_billed_units: 250 } },
    })
    const { result } = renderHook(() => useBillAnalyzer())
    await act(async () => {
      result.current.handleBillFile(pdfFile())
    })
    await waitFor(() => {
      expect(result.current.billUploadState).toBe('complete')
    })
    expect(result.current.analysis?.netBilledUnits).toBe(250)
  })

  it('missing net_billed_units stays null and Net Grid Energy stays independent', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, data: { monthly_units: 400, bill_amount: 3000 } },
    })
    const { result } = renderHook(() => useBillAnalyzer())
    await act(async () => {
      result.current.handleBillFile(pdfFile())
    })
    await waitFor(() => {
      expect(result.current.billUploadState).toBe('complete')
    })
    expect(result.current.analysis?.netBilledUnits).toBeNull()
    // No grid export data -> page-level Net Grid Energy stays null (renders —)
    expect(result.current.analysis?.gridExport).toBeNull()
    expect(result.current.analysis?.exportUnits).toBeNull()
  })

  it('upload state recovers after a failed analysis', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network down'))
    const { result } = renderHook(() => useBillAnalyzer())
    await act(async () => {
      result.current.handleBillFile(pdfFile())
    })
    await waitFor(() => {
      expect(result.current.billUploadState).toBe('error')
    })
    mockPost.mockResolvedValue({
      data: { success: true, data: { monthly_units: 250, bill_amount: 1800 } },
    })
    await act(async () => {
      result.current.handleBillFile(pdfFile('bill2.pdf'))
    })
    await waitFor(() => {
      expect(result.current.billUploadState).toBe('complete')
    })
    expect(result.current.analysis).not.toBeNull()
  })
})
