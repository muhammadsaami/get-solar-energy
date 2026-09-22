import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  loadPreferences,
  savePreferences,
  addActivityLog,
  createNotification,
} from '../services/settings.service'
import { getUserStorageKey } from '../../utils/userStorage'

const USER_A = { id: 'set-user-a', email: 'a@settings.test' }
const USER_B = { id: 'set-user-b', email: 'b@settings.test' }
let activeUser: any = USER_A

vi.mock('../../services/auth/tokenManager', () => ({
  tokenManager: { getUser: () => activeUser },
}))

function keyFor(base: string, user: any) {
  return getUserStorageKey(base, user)
}

describe('Account Settings storage isolation', () => {
  beforeEach(() => {
    localStorage.clear()
    activeUser = USER_A
    vi.clearAllMocks()
  })

  it('User A preferences restore for User A only', () => {
    savePreferences({ discom: 'bescom', tariff: '9.50', netMetering: 'gross' })
    expect(loadPreferences()).toEqual({ discom: 'bescom', tariff: '9.50', netMetering: 'gross' })
    activeUser = USER_B
    expect(loadPreferences()).toEqual({ discom: 'dvvnl', tariff: '7.50', netMetering: 'net' })
  })

  it('A -> B -> A isolates preferences, notifications, and activity log', () => {
    savePreferences({ discom: 'bescom', tariff: '9.50', netMetering: 'gross' })
    addActivityLog('settings', 'A action', 'A did something')
    createNotification('system', 'A note', 'Hello A')
    activeUser = USER_B
    expect(loadPreferences().tariff).toBe('7.50')
    savePreferences({ discom: 'mseb', tariff: '8.00', netMetering: 'net' })
    addActivityLog('settings', 'B action', 'B did something')
    expect(loadPreferences().tariff).toBe('8.00')
    activeUser = USER_A
    expect(loadPreferences().tariff).toBe('9.50')
    const aLogs = JSON.parse(localStorage.getItem(keyFor('activityLog', USER_A)) || '[]')
    const bLogs = JSON.parse(localStorage.getItem(keyFor('activityLog', USER_B)) || '[]')
    expect(aLogs[0].title).toBe('A action')
    expect(bLogs[0].title).toBe('B action')
    const aNotes = JSON.parse(localStorage.getItem(keyFor('notifications', USER_A)) || '[]')
    expect(aNotes[0].title).toBe('A note')
    expect(localStorage.getItem(keyFor('notifications', USER_B))).toBeNull()
  })

  it('legacy global keys are never adopted and get purged', () => {
    localStorage.setItem('userPreferences', JSON.stringify({ discom: 'bescom', tariff: '9.50', netMetering: 'gross' }))
    localStorage.setItem('notifications', JSON.stringify([{ title: 'Old' }]))
    localStorage.setItem('activityLog', JSON.stringify([{ title: 'Old log' }]))
    activeUser = USER_B
    expect(loadPreferences().tariff).toBe('7.50')
    expect(localStorage.getItem('userPreferences')).toBeNull()
    expect(localStorage.getItem('notifications')).toBeNull()
    expect(localStorage.getItem('activityLog')).toBeNull()
  })

  it('malformed persisted data falls back to truthful defaults', () => {
    localStorage.setItem(keyFor('userPreferences', USER_A), 'not-json{{{')
    expect(loadPreferences()).toEqual({ discom: 'dvvnl', tariff: '7.50', netMetering: 'net' })
    localStorage.setItem(keyFor('activityLog', USER_A), '{"oops":true}')
    addActivityLog('settings', 'Fresh', 'recovered')
    const logs = JSON.parse(localStorage.getItem(keyFor('activityLog', USER_A)) || '[]')
    expect(logs).toHaveLength(1)
    expect(logs[0].title).toBe('Fresh')
  })

  it('fresh user receives truthful defaults', () => {
    expect(loadPreferences()).toEqual({ discom: 'dvvnl', tariff: '7.50', netMetering: 'net' })
  })
})
