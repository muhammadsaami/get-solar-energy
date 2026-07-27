import React from 'react'
import { useSettings } from '../hooks/useSettings'
import { SettingsPageHeader } from '../components/SettingsPageHeader'
import { SettingsPreferencesCard } from '../components/SettingsPreferencesCard'
import { SettingsForm } from '../components/SettingsForm'
import { SettingsLoadingSkeleton } from '../components/SettingsLoadingSkeleton'
import { SettingsErrorBanner } from '../components/SettingsErrorBanner'
import PermissionGate from '../../components/auth/PermissionGate'
import DashboardSprites from '../../components/dashboard/DashboardSprites'

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
    <>
      <DashboardSprites />
      <div className="tab-content" role="tabpanel" aria-label="settings" style={{ display: 'block' }}>
        <SettingsPageHeader />

        {loading && <SettingsLoadingSkeleton />}

        {error && (
          <SettingsErrorBanner
            message={error.message}
            onDismiss={clearError}
          />
        )}

        {!loading && !error && (
          <>
            <SettingsPreferencesCard readonlyProfile={readonlyProfile}>
              <SettingsForm
                preferences={preferences}
                saving={saving}
                isDirty={isDirty}
                onPreferenceChange={updatePreference}
                onSave={save}
              />
            </SettingsPreferencesCard>

            <PermissionGate feature="settings-admin">
              <div
                className="card-base"
                style={{ maxWidth: '600px', marginTop: '20px', '--card-theme': '255, 138, 29' } as React.CSSProperties}
              >
                <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color-light)', paddingBottom: '12px', marginBottom: '15px' }}>
                  <span className="kpi-title">Platform Configuration</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Admin-level platform settings will appear here.
                </p>
              </div>
            </PermissionGate>
          </>
        )}
      </div>
    </>
  )
}
