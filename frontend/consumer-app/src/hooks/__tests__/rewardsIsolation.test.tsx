import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  saveRewardsToLocalStorage,
  loadRewardsFromLocalStorage,
  clearRewardsFromLocalStorage,
} from '../../utils/rewardsLocalStorage'
import { getUserStorageKey } from '../../utils/userStorage'
import { useRewards } from '../useRewards'

const USER_A = { id: 'rw-user-a', email: 'a@rewards.test', name: 'A', referral_code: 'CODE-A' }
const USER_B = { id: 'rw-user-b', email: 'b@rewards.test', name: 'B', referral_code: 'CODE-B' }
let activeUser: any = USER_A

vi.mock('../../utils/referral', () => ({
  getUser: () => activeUser,
}))

const mockFetchAnalytics = vi.fn()
vi.mock('../../services/reward.service', () => ({
  fetchAnalytics: (...a: any[]) => mockFetchAnalytics(...a),
  applyReferralCode: vi.fn(),
  redeemReward: vi.fn(),
}))

const SAMPLE = { success: true, referral_code: 'CODE-A', summary: { total_points: 500 } }

function keyFor(user: any) {
  return getUserStorageKey('lastRewardsData', user)
}

describe('Rewards storage isolation', () => {
  beforeEach(() => {
    localStorage.clear()
    activeUser = USER_A
    vi.clearAllMocks()
  })

  it('User A persisted rewards restore for User A', () => {
    saveRewardsToLocalStorage(SAMPLE as any)
    expect(loadRewardsFromLocalStorage()).toEqual(SAMPLE)
    expect(localStorage.getItem(keyFor(USER_A))).not.toBeNull()
  })

  it('User B cannot restore User A rewards', () => {
    saveRewardsToLocalStorage(SAMPLE as any)
    activeUser = USER_B
    expect(loadRewardsFromLocalStorage()).toBeNull()
    expect(localStorage.getItem(keyFor(USER_A))).not.toBeNull()
    expect(localStorage.getItem(keyFor(USER_B))).toBeNull()
  })

  it('A -> B -> A isolates and restores per account', () => {
    saveRewardsToLocalStorage(SAMPLE as any)
    activeUser = USER_B
    expect(loadRewardsFromLocalStorage()).toBeNull()
    const B_DATA = { success: true, referral_code: 'CODE-B', summary: { total_points: 50 } }
    saveRewardsToLocalStorage(B_DATA as any)
    expect(loadRewardsFromLocalStorage()).toEqual(B_DATA)
    activeUser = USER_A
    expect(loadRewardsFromLocalStorage()).toEqual(SAMPLE)
  })

  it('legacy global key is never adopted and gets purged', () => {
    localStorage.setItem('lastRewardsData', JSON.stringify(SAMPLE))
    activeUser = USER_B
    expect(loadRewardsFromLocalStorage()).toBeNull()
    expect(localStorage.getItem('lastRewardsData')).toBeNull()
  })

  it('malformed persisted data is ignored safely', () => {
    localStorage.setItem(keyFor(USER_A), 'not-json{{{')
    expect(loadRewardsFromLocalStorage()).toBeNull()
    expect(localStorage.getItem(keyFor(USER_A))).toBeNull()
  })

  it('clear removes scoped data and legacy residue', () => {
    saveRewardsToLocalStorage(SAMPLE as any)
    localStorage.setItem('lastRewardsData', JSON.stringify(SAMPLE))
    clearRewardsFromLocalStorage()
    expect(localStorage.getItem(keyFor(USER_A))).toBeNull()
    expect(localStorage.getItem('lastRewardsData')).toBeNull()
  })

  it('hook hydrates per-account data without cross-account bleed', async () => {
    mockFetchAnalytics.mockImplementation(async (email: string) =>
      email === USER_A.email
        ? { success: true, referral_code: 'CODE-A', summary: { total_points: 500 } }
        : { success: true, referral_code: 'CODE-B', summary: { total_points: 50 } },
    )
    const { result: a } = renderHook(() => useRewards())
    await waitFor(() => {
      expect(a.current.state.loading).toBe(false)
    })
    expect(a.current.state.summary).toEqual({ total_points: 500 })

    activeUser = USER_B
    const { result: b } = renderHook(() => useRewards())
    await waitFor(() => {
      expect(b.current.state.loading).toBe(false)
    })
    expect(b.current.state.summary).toEqual({ total_points: 50 })
    expect(b.current.state.referralCode).toBe('CODE-B')
    expect(localStorage.getItem(keyFor(USER_A))).not.toBeNull()
    expect(localStorage.getItem(keyFor(USER_B))).not.toBeNull()
  })
})
