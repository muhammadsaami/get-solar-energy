import React, { useId } from 'react'
import type { SettingsPreferences } from '../types/settings.types'
import { DISCOM_OPTIONS, NET_METERING_OPTIONS } from '../config/settings.config'

interface SettingsFormProps {
  preferences: SettingsPreferences
  saving: boolean
  isDirty: boolean
  onPreferenceChange: <K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) => void
  onSave: () => void
}

function SettingsFormComponent({
  preferences,
  saving,
  isDirty,
  onPreferenceChange,
  onSave,
}: SettingsFormProps) {
  const discomId = useId()
  const tariffId = useId()
  const meteringId = useId()

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave() }}>
      <div className="form-group">
        <label className="form-label" htmlFor={discomId}>State Discom (Utility Provider)</label>
        <select
          id={discomId}
          className="form-select"
          value={preferences.discom}
          onChange={(e) => onPreferenceChange('discom', e.target.value)}
        >
          {DISCOM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor={tariffId}>Base Tariff Rate (\u20B9/kWh)</label>
          <input
            id={tariffId}
            type="number"
            className="form-input"
            value={preferences.tariff}
            step={0.01}
            onChange={(e) => onPreferenceChange('tariff', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={meteringId}>Net Metering Type</label>
          <select
            id={meteringId}
            className="form-select"
            value={preferences.netMetering}
            onChange={(e) => onPreferenceChange('netMetering', e.target.value)}
          >
            {NET_METERING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: '10px' }}>
        <button
          type="submit"
          className="calc-btn"
          disabled={saving || !isDirty}
          style={{ marginTop: 0, width: 'auto' }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}

export const SettingsForm = React.memo(SettingsFormComponent)
