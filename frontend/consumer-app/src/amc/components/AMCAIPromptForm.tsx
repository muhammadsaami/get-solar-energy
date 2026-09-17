import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { MdAutoAwesome } from 'react-icons/md'
import { getDefaultRecommendationRequest } from '../services/amc.service'
import type { AMCRecommendationRequest } from '../types/amc.types'

export interface AMCAIPromptFormHandle {
  setFormValues: (values: Partial<AMCRecommendationRequest>) => void
  resetForm: () => void
}

interface AMCAIPromptFormProps {
  onRecommend: (request: AMCRecommendationRequest) => void
  recommending: boolean
  disabled?: boolean
  onAutofill?: () => void
  onReset?: () => void
}

const today = new Date().toISOString().split('T')[0]

const AMCAIPromptFormComponent = forwardRef<AMCAIPromptFormHandle, AMCAIPromptFormProps>(
  function AMCAIPromptForm({ onRecommend, recommending, disabled = false, onAutofill, onReset }: AMCAIPromptFormProps, ref) {
  const defaults = getDefaultRecommendationRequest()
  const [customerName, setCustomerName] = useState(defaults.customer_name || '')
  const [city, setCity] = useState(defaults.city || '')
  const [systemSizeKw, setSystemSizeKw] = useState(defaults.system_size_kw || 5.0)
  const [installationDate, setInstallationDate] = useState('2022-01-01')
  const [lastServiceDate, setLastServiceDate] = useState('')
  const [currentGenUnits, setCurrentGenUnits] = useState(defaults.current_generation_units || 0)
  const [expectedGenUnits, setExpectedGenUnits] = useState(defaults.expected_generation_units || 0)
  const [inverterErrorCodes, setInverterErrorCodes] = useState('None')
  const [panelCleaningDone, setPanelCleaningDone] = useState(false)
  const [physicalDamage, setPhysicalDamage] = useState(false)
  const [damageDetails, setDamageDetails] = useState('None')

  useImperativeHandle(ref, () => ({
    setFormValues: (values: Partial<AMCRecommendationRequest>) => {
      if (values.customer_name !== undefined) setCustomerName(values.customer_name)
      if (values.city !== undefined) setCity(values.city)
      if (values.system_size_kw !== undefined) setSystemSizeKw(values.system_size_kw)
      if (values.installation_date !== undefined) setInstallationDate(values.installation_date)
      if (values.last_service_date !== undefined) setLastServiceDate(values.last_service_date)
      if (values.current_generation_units !== undefined) setCurrentGenUnits(values.current_generation_units)
      if (values.expected_generation_units !== undefined) setExpectedGenUnits(values.expected_generation_units)
      if (values.inverter_error_codes !== undefined) setInverterErrorCodes(values.inverter_error_codes)
      if (values.panel_cleaning_done !== undefined) setPanelCleaningDone(values.panel_cleaning_done)
      if (values.physical_damage_observed !== undefined) setPhysicalDamage(values.physical_damage_observed)
      if (values.damage_details !== undefined) setDamageDetails(values.damage_details)
    },
    resetForm: () => {
      setCustomerName('')
      setCity('Lucknow')
      setSystemSizeKw(5.0)
      setInstallationDate('')
      setLastServiceDate('')
      setCurrentGenUnits(0)
      setExpectedGenUnits(0)
      setInverterErrorCodes('None')
      setPanelCleaningDone(false)
      setPhysicalDamage(false)
      setDamageDetails('None')
    },
  }), [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (recommending) return
    onRecommend({
      customer_name: customerName,
      city,
      system_size_kw: systemSizeKw,
      installation_date: installationDate,
      last_service_date: lastServiceDate,
      current_generation_units: currentGenUnits,
      expected_generation_units: expectedGenUnits,
      inverter_error_codes: inverterErrorCodes,
      panel_cleaning_done: panelCleaningDone,
      physical_damage_observed: physicalDamage,
      damage_details: physicalDamage ? damageDetails : 'None',
    })
  }

  const handleAutofill = () => {
    onAutofill?.()
  }

  const handleReset = () => {
    onReset?.()
  }

  return (
    <div className="card-base" style={{ '--card-theme': '139, 92, 246' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <span className="kpi-title">AI-Powered AMC Recommendation</span>
        <span className="api-tag" style={{ fontSize: '7px', padding: '1px 4px', '--card-theme': '139, 92, 246' } as React.CSSProperties}>
          Gemini AI
        </span>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 16px', lineHeight: 1.5 }}>
        Generate a professional AMC service report using Gemini AI. Fill in your solar system details below.
        Defaults are pre-filled from your bill analysis if available.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={recommending}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={recommending}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              System Size (kW)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="50"
              value={systemSizeKw}
              onChange={(e) => setSystemSizeKw(parseFloat(e.target.value) || 0)}
              disabled={recommending}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Installation Date
            </label>
            <input
              type="date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
              disabled={recommending}
              max={today}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Last Service Date
            </label>
            <input
              type="date"
              value={lastServiceDate}
              onChange={(e) => setLastServiceDate(e.target.value)}
              disabled={recommending}
              max={today}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Inverter Error Codes
            </label>
            <input
              type="text"
              value={inverterErrorCodes}
              onChange={(e) => setInverterErrorCodes(e.target.value)}
              placeholder="e.g. E04, E07 or None"
              disabled={recommending}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Last Month Generation (Units)
            </label>
            <input
              type="number"
              min="0"
              value={currentGenUnits}
              onChange={(e) => setCurrentGenUnits(parseInt(e.target.value) || 0)}
              disabled={recommending}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Expected Generation (Units)
            </label>
            <input
              type="number"
              min="0"
              value={expectedGenUnits}
              onChange={(e) => setExpectedGenUnits(parseInt(e.target.value) || 0)}
              disabled={recommending}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-navy)' }}>
            <input
              type="checkbox"
              checked={panelCleaningDone}
              onChange={(e) => setPanelCleaningDone(e.target.checked)}
              disabled={recommending}
            />
            Panel Cleaning Done Recently
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-navy)' }}>
            <input
              type="checkbox"
              checked={physicalDamage}
              onChange={(e) => { setPhysicalDamage(e.target.checked); if (!e.target.checked) setDamageDetails('None') }}
              disabled={recommending}
            />
            Physical Damage Observed
          </label>
        </div>

        {physicalDamage && (
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '4px' }}>
              Damage Details
            </label>
            <input
              type="text"
              value={damageDetails}
              onChange={(e) => setDamageDetails(e.target.value)}
              placeholder="Describe the damage observed"
              disabled={recommending}
              style={{
                width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '6px',
                background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--border-color)',
                color: 'var(--text-navy)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <div className="vendor-form-buttons" style={{ marginTop: '15px', display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="calc-btn"
            onClick={handleAutofill}
            disabled={recommending}
            style={{
              marginTop: 0, width: 'auto',
              backgroundColor: 'rgba(0, 174, 239, 0.15)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(0, 174, 239, 0.3)',
            }}
          >
            Autofill Demo
          </button>
          <button
            type="button"
            className="calc-btn"
            onClick={handleReset}
            disabled={recommending}
            style={{
              marginTop: 0, width: 'auto',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-navy)',
            }}
          >
            Clear Form
          </button>
          <button
            type="submit"
            className="calc-btn"
            disabled={recommending || disabled}
            style={{
              marginTop: 0, flex: 1,
              backgroundColor: 'var(--accent-blue)',
            }}
          >
            <MdAutoAwesome />
            {recommending ? 'Generating...' : 'Generate Recommendation'}
          </button>
        </div>
      </form>
    </div>
  )
})

export const AMCAIPromptForm = React.memo(AMCAIPromptFormComponent)
