import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  saveAMCToLocalStorage,
  loadAMCFromLocalStorage,
  clearAMCFromLocalStorage,
} from '../utils/amcLocalStorage'
import { getUserStorageKey } from '../../utils/userStorage'
import AMC from '../pages/AMC'

// Stable identities: storage keys effects on user identity, so the mock must
// return a stable reference per account (never fresh literals).
const USER_A = { id: 'amc-user-a', email: 'a@amc.test' }
const USER_B = { id: 'amc-user-b', email: 'b@amc.test' }
let activeUser: any = USER_A

vi.mock('../../services/auth/tokenManager', () => ({
  tokenManager: { getUser: () => activeUser },
}))

vi.mock('../../stores/notificationStore', () => ({
  useNotificationStore: (sel: any) => sel({ addToast: vi.fn() }),
}))

const mockUseAMC = vi.fn()
vi.mock('../hooks/useAMC', () => ({
  useAMC: (...a: any[]) => mockUseAMC(...a),
}))

const mockApiPost = vi.fn()
vi.mock('../../services/api/client', () => ({
  default: {
    post: (...a: any[]) => mockApiPost(...a),
    get: vi.fn().mockResolvedValue({ data: null }),
  },
}))

import { fetchAMCRecommendation, invalidateAMCCache } from '../services/amc.service'

const SAMPLE_REC = { systemStatus: 'Healthy', healthScore: 88, estimatedServiceCostRs: 12000 }

function keyFor(user: any) {
  return getUserStorageKey('lastGeneratedAmc', user)
}

function hookState(overrides: any = {}) {
  return {
    contract: null, kpis: null, recommendation: null, serviceHistory: [], visits: [],
    loading: false, recommending: false, tab: 'recommendation', error: null,
    refresh: vi.fn(), getRecommendation: vi.fn(), setTab: vi.fn(),
    ...overrides,
  }
}

describe('AMC storage isolation + demo residue', () => {
  beforeEach(() => {
    localStorage.clear()
    activeUser = USER_A
    vi.clearAllMocks()
  })

  it('Test 2/7: User A persisted data restores for User A', () => {
    saveAMCToLocalStorage(SAMPLE_REC)
    expect(loadAMCFromLocalStorage()).toEqual(SAMPLE_REC)
    expect(localStorage.getItem(keyFor(USER_A))).not.toBeNull()
  })

  it('Test 3 (mandatory): User B cannot restore User A data', () => {
    saveAMCToLocalStorage(SAMPLE_REC)
    activeUser = USER_B
    expect(loadAMCFromLocalStorage()).toBeNull()
    expect(localStorage.getItem(keyFor(USER_A))).not.toBeNull()
    expect(localStorage.getItem(keyFor(USER_B))).toBeNull()
  })

  it('Account transition A -> B -> A isolates and restores per account', () => {
    // A generates AMC
    saveAMCToLocalStorage(SAMPLE_REC)
    // A logs out, B logs in: B sees nothing of A's
    activeUser = USER_B
    expect(loadAMCFromLocalStorage()).toBeNull()
    // B generates their own AMC
    const B_REC = { ...SAMPLE_REC, healthScore: 61 }
    saveAMCToLocalStorage(B_REC)
    expect(loadAMCFromLocalStorage()).toEqual(B_REC)
    // B logs out, A logs back in: A gets A's own data back
    activeUser = USER_A
    expect(loadAMCFromLocalStorage()).toEqual(SAMPLE_REC)
    // And B's data is still intact for B
    activeUser = USER_B
    expect(loadAMCFromLocalStorage()).toEqual(B_REC)
  })

  it('Test 7: same-account persistence survives reload and hydrates the page', () => {
    const FULL_REC = {
      ...SAMPLE_REC,
      generationDropPct: 5,
      nextServiceDue: '2026-12-01',
      faultAnalysis: [],
      recommendedActions: [],
      preventiveMeasures: [],
    }
    saveAMCToLocalStorage(FULL_REC)
    // Simulate a reload: a fresh read as the same user restores the data
    expect(loadAMCFromLocalStorage()).toEqual(FULL_REC)
    mockUseAMC.mockReturnValue(hookState())
    render(<AMC />)
    expect(document.body.textContent).toMatch(/88%/)
  })

  it('Recommendation in-memory cache is scoped per account', async () => {
    invalidateAMCCache()
    mockApiPost.mockResolvedValue({ data: { success: true, data: { customer_name: 'Same', system_size_kw: 5 } } })
    const req = { customer_name: 'Same', system_size_kw: 5 } as any
    activeUser = USER_A
    await fetchAMCRecommendation(req)
    expect(mockApiPost).toHaveBeenCalledTimes(1)
    // Same name/size under User B must NOT serve User A's cached response
    activeUser = USER_B
    await fetchAMCRecommendation(req)
    expect(mockApiPost).toHaveBeenCalledTimes(2)
    // Same account re-request hits that account's cache
    await fetchAMCRecommendation(req)
    expect(mockApiPost).toHaveBeenCalledTimes(2)
  })

  it('Test 4: legacy global key is never adopted and gets purged', () => {
    localStorage.setItem('lastGeneratedAmc', JSON.stringify(SAMPLE_REC))
    activeUser = USER_B
    expect(loadAMCFromLocalStorage()).toBeNull()
    expect(localStorage.getItem('lastGeneratedAmc')).toBeNull()
  })

  it('Test 8: malformed persisted data is ignored safely', () => {
    localStorage.setItem(keyFor(USER_A), 'not-json{{{')
    expect(loadAMCFromLocalStorage()).toBeNull()
    expect(localStorage.getItem(keyFor(USER_A))).toBeNull()
  })

  it('clear removes scoped data and legacy residue', () => {
    saveAMCToLocalStorage(SAMPLE_REC)
    localStorage.setItem('lastGeneratedAmc', JSON.stringify(SAMPLE_REC))
    clearAMCFromLocalStorage()
    expect(localStorage.getItem(keyFor(USER_A))).toBeNull()
    expect(localStorage.getItem('lastGeneratedAmc')).toBeNull()
  })

  it('Test 1/5/9/10: fresh customer sees honest empty state, no demo residue', () => {
    mockUseAMC.mockReturnValue(hookState())
    render(<AMC />)
    const text = document.body.textContent || ''
    expect(text).not.toMatch(/autofilled demo/i)
    expect(text).not.toMatch(/2022-01-01/)
    expect(text).not.toMatch(/rajesh kumar/i)
    expect(text).not.toMatch(/demo customer/i)
    expect(screen.queryByText(/5\.0\s*kW/)).not.toBeInTheDocument()
  })

  it('Test 6: real backend recommendation still renders', () => {
    mockUseAMC.mockReturnValue(hookState({
      recommendation: {
        systemStatus: 'Healthy', healthScore: 88, estimatedServiceCostRs: 12000,
        generationDropPct: 5, nextServiceDue: '2026-12-01', faultAnalysis: [],
        recommendedActions: [], preventiveMeasures: [],
      },
    }))
    render(<AMC />)
    expect(document.body.textContent).toMatch(/88%/)
  })
})
