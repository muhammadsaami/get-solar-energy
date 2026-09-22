import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRoofAnalyzer } from '../useRoofAnalyzer'
import { getUserStorageKey } from '../../utils/userStorage'

const mockPost = vi.fn()
vi.mock('../../services/api/client', () => ({
  default: { post: (...a: any[]) => mockPost(...a) },
}))

vi.mock('../../services/auth/tokenManager', () => ({
  tokenManager: { getUser: () => ({ id: 'roof-u1', email: 'roof@getsolar.test' }) },
}))

const ROOF_KEY = getUserStorageKey('lastRoofAnalysis', { id: 'roof-u1', email: 'roof@getsolar.test' })

describe('Roof analyzer fallback honesty', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('fallback:true response becomes an honest error with no persist and no render', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, fallback: true, data: { system_size_kw: 3, facing_direction: 'South' } },
    })
    const { result } = renderHook(() => useRoofAnalyzer())
    const file = new File(['img'], 'roof.png', { type: 'image/png' })
    act(() => {
      result.current.handleCameraFileSelect(file)
    })
    act(() => {
      result.current.triggerCameraAnalysis()
    })
    await waitFor(() => {
      expect(result.current.roofUploadState).toBe('error')
    })
    expect(result.current.roofError).toMatch(/temporarily unavailable/i)
    expect(result.current.analysis).toBeNull()
    expect(localStorage.getItem(ROOF_KEY)).toBeNull()
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('real backend analysis still renders and persists', async () => {
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: { facing_direction: 'South', roof_condition: 'Good', system_size_kw: 5 },
      },
    })
    const { result } = renderHook(() => useRoofAnalyzer())
    const file = new File(['img'], 'roof.png', { type: 'image/png' })
    act(() => {
      result.current.handleCameraFileSelect(file)
    })
    act(() => {
      result.current.triggerCameraAnalysis()
    })
    await waitFor(() => {
      expect(result.current.roofUploadState).toBe('complete')
    })
    expect(result.current.analysis).not.toBeNull()
    expect(localStorage.getItem(ROOF_KEY)).not.toBeNull()
  })
})
