import React, { useId } from 'react'
import type { ReadonlyProfile } from '../types/settings.types'

interface SettingsPreferencesCardProps {
  readonlyProfile: ReadonlyProfile
  children: React.ReactNode
}

function SettingsPreferencesCardComponent({ readonlyProfile, children }: SettingsPreferencesCardProps) {
  const nameId = useId()
  const roleId = useId()

  return (
    <div
      className="card-base"
      style={{ maxWidth: '600px', '--card-theme': '23, 168, 229' } as React.CSSProperties}
    >
      <div
        className="kpi-header-row"
        style={{ borderBottom: '1px solid var(--border-color-light)', paddingBottom: '12px', marginBottom: '15px' }}
      >
        <span className="kpi-title">Profile & Solar Preferences</span>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="form-group">
          <label className="form-label" htmlFor={nameId}>User Profile Name</label>
          <input
            id={nameId}
            type="text"
            className="form-input"
            value={readonlyProfile.name}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={roleId}>Role Profile</label>
          <input
            id={roleId}
            type="text"
            className="form-input"
            value={readonlyProfile.role}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
          />
        </div>
      </div>

      {children}
    </div>
  )
}

export const SettingsPreferencesCard = React.memo(SettingsPreferencesCardComponent)
