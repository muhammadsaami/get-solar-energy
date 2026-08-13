import React from 'react'
import { useSettings } from '../hooks/useSettings'
import { SettingsPageHeader } from '../components/SettingsPageHeader'
import { SettingsPreferencesCard } from '../components/SettingsPreferencesCard'
import { SettingsForm } from '../components/SettingsForm'
import { SettingsLoadingSkeleton } from '../components/SettingsLoadingSkeleton'
import { SettingsErrorBanner } from '../components/SettingsErrorBanner'
import { SecuritySessionManager } from '../components/SecuritySessionManager'
import PermissionGate from '../../components/auth/PermissionGate'

export default function SettingsPage() {
  const {
    preferences,
    readonlyProfile,
    loading,
    saving,
    error,
    isDirty,
    updatePreference,
    save,
    clearError,
  } = useSettings()

  return (
    <div className="ew-page" role="tabpanel" aria-label="settings">
      <SettingsPageHeader />

      {loading && <SettingsLoadingSkeleton />}

      {error && (
        <SettingsErrorBanner
          message={error.message}
          onDismiss={clearError}
        />
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <SettingsPreferencesCard readonlyProfile={readonlyProfile}>
            <SettingsForm
              preferences={preferences}
              saving={saving}
              isDirty={isDirty}
              onPreferenceChange={updatePreference}
              onSave={save}
            />
          </SettingsPreferencesCard>

          {/* Security & Active Session Management */}
          <SecuritySessionManager />

          <PermissionGate feature="settings-admin">
            <div className="card-base" style={{ maxWidth: '640px', '--card-theme': '255, 138, 29' } as React.CSSProperties}>
              <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span className="kpi-title">Platform Administrative Configuration</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Enterprise security controls, API key lifecycle management, and team permissions are active.
              </p>
            </div>
          </PermissionGate>
        </div>
      )}
    </div>
  )
}
