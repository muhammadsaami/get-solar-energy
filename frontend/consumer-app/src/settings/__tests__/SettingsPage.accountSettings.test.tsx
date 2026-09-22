import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from '../hooks/useSettings'
import { SettingsPreferencesCard } from '../components/SettingsPreferencesCard'
import { SettingsForm } from '../components/SettingsForm'
import { getUserStorageKey } from '../../utils/userStorage'

// NOTE: stable reference required — useSettings keys its load effect on
// auth?.user, so a fresh object per useAuth() call would loop renders.
const stableUser = { name: 'Test Customer', displayRole: 'Standard User' }
const stableTokenUser = { id: 'settings-page-u1', email: 'settings-page@getsolar.test' }

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: stableUser }),
}))

vi.mock('../../services/auth/tokenManager', () => ({
  tokenManager: { getUser: () => stableTokenUser },
}))

vi.mock('../../stores/notificationStore', () => ({
  useNotificationStore: (sel: any) => sel({ addToast: vi.fn() }),
}))

describe('Account Settings page (device-scoped prefs)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('labels prefs card as device-local with account-security pointer', () => {
    render(
      <SettingsPreferencesCard readonlyProfile={{ name: 'Test Customer', role: 'Standard User' }}>
        <div>child</div>
      </SettingsPreferencesCard>,
    )
    expect(screen.getByText(/profile & device preferences/i)).toBeInTheDocument()
    expect(screen.getByText(/this device only/i)).toBeInTheDocument()
  })

  it('form save button is device-scoped', () => {
    render(
      <SettingsForm
        preferences={{ discom: 'dvvnl', tariff: '7.50', netMetering: 'net' }}
        saving={false}
        isDirty
        onPreferenceChange={() => {}}
        onSave={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /save device preferences/i })).toBeInTheDocument()
  })

  it('successful save persists device prefs without account-success wording', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.updatePreference('tariff', '9.50')
    })
    act(() => {
      result.current.save()
    })
    const saved = JSON.parse(
      localStorage.getItem(getUserStorageKey('userPreferences', stableTokenUser)) || '{}',
    )
    expect(saved.tariff).toBe('9.50')
    expect(result.current.error).toBeNull()
  })

  it('invalid tariff blocks save and surfaces a controlled error (no false success)', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.updatePreference('tariff', '99')
    })
    act(() => {
      result.current.save()
    })
    expect(result.current.error?.message).toMatch(/tariff must be between/i)
  })
})
