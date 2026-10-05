import React, { useState, useEffect, useRef, useId } from 'react'
import type {
  SolarReportingPeriodType,
  ManualSolarFormState,
  ManualSolarValidationErrors,
  DailyProductionPoint,
} from '../../types/solarProduction.types'
import {
  validateManualSolarInput,
  buildCanonicalSolarPayload,
  formatPeriodSummary,
} from '../../utils/solarProductionValidation'
import type { SolarReportData } from '../../hooks/billAnalyzer.types'

interface ManualSolarProductionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SolarReportData) => void
  initialData?: SolarReportData | null
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function ManualSolarProductionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ManualSolarProductionModalProps) {
  const titleId = useId()
  const modalRef = useRef<HTMLDivElement>(null)

  // Default date strings
  const today = new Date().toISOString().split('T')[0]
  const currentYear = String(new Date().getFullYear())
  const currentMonthName = MONTH_NAMES[new Date().getMonth()]

  // 1. Initial State
  const getInitialState = (): ManualSolarFormState => {
    if (initialData && initialData.productionKwh != null) {
      const pType: SolarReportingPeriodType =
        (initialData.periodType as SolarReportingPeriodType) ||
        (initialData.month ? 'month' : 'custom')
      return {
        periodType: pType,
        date: initialData.startDate || today,
        weekStartDate: initialData.startDate || today,
        weekEndDate: initialData.endDate || today,
        month: initialData.month || currentMonthName,
        year: initialData.year ? String(initialData.year) : currentYear,
        lifetimeAsOfDate: initialData.endDate || today,
        customStartDate: initialData.startDate || today,
        customEndDate: initialData.endDate || today,
        productionKwh: String(initialData.productionKwh),
        installedCapacityKwp: initialData.systemSizeKw != null ? String(initialData.systemSizeKw) : '',
        dailyPoints: initialData.dailyPoints || [],
      }
    }
    return {
      periodType: 'month',
      date: today,
      weekStartDate: today,
      weekEndDate: today,
      month: currentMonthName,
      year: currentYear,
      lifetimeAsOfDate: today,
      customStartDate: today,
      customEndDate: today,
      productionKwh: '',
      installedCapacityKwp: '',
      dailyPoints: [],
    }
  }

  const [formState, setFormState] = useState<ManualSolarFormState>(getInitialState)
  const [step, setStep] = useState<'entry' | 'review'>('entry')
  const [errors, setErrors] = useState<ManualSolarValidationErrors>({})
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setFormState(getInitialState())
      setStep('entry')
      setErrors({})
      setShowDailyBreakdown(false)
    }
  }, [isOpen, initialData])

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Period Selector change handler
  const handlePeriodChange = (period: SolarReportingPeriodType) => {
    setFormState((prev) => ({
      ...prev,
      periodType: period,
    }))
    setErrors((prev) => ({
      ...prev,
      periodType: undefined,
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    }))
  }

  // Handle Advance to Review
  const handleReview = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateManualSolarInput(formState)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setStep('review')
  }

  // Handle Canonical Save
  const handleSave = () => {
    const payload = buildCanonicalSolarPayload(formState)
    const solarReportData: SolarReportData = {
      productionKwh: payload.productionKwh,
      systemSizeKw: payload.installedCapacityKwp,
      month: payload.month || null,
      year: payload.year || null,
      source: 'manual',
      dailyGenerationKwh: payload.dailyPoints && payload.dailyPoints.length > 0
        ? Number((payload.dailyPoints.reduce((acc, p) => acc + p.productionKwh, 0) / payload.dailyPoints.length).toFixed(2))
        : null,
      confidence: 1.0,
      periodType: payload.periodType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      dailyPoints: payload.dailyPoints,
    }
    onSave(solarReportData)
    onClose()
  }

  // Daily points helpers
  const handleAddDailyPoint = () => {
    const newPt: DailyProductionPoint = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: formState.date || today,
      productionKwh: 0,
    }
    setFormState((prev) => ({
      ...prev,
      dailyPoints: [...prev.dailyPoints, newPt],
    }))
  }

  const handleRemoveDailyPoint = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      dailyPoints: prev.dailyPoints.filter((p) => p.id !== id),
    }))
  }

  const handleUpdateDailyPoint = (
    id: string,
    field: 'date' | 'productionKwh',
    value: string | number
  ) => {
    setFormState((prev) => ({
      ...prev,
      dailyPoints: prev.dailyPoints.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }))
  }

  // Prepared review data
  const reviewPayload = step === 'review' ? buildCanonicalSolarPayload(formState) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="manual-solar-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(3, 8, 16, 0.78)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="card-base manual-solar-modal-container"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'rgba(8, 24, 42, 0.95)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6)',
          padding: '24px',
          color: '#F0F8FF',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 138, 29, 0.15)',
                border: '1px solid rgba(255, 138, 29, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-orange, #ff8a1d)',
              }}
            >
              <svg
                style={{ width: '18px', height: '18px', stroke: 'currentColor', fill: 'none', strokeWidth: '2' }}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <div>
              <h3
                id={titleId}
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  margin: 0,
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                }}
              >
                {step === 'entry' ? 'Enter Solar Production Readings' : 'Review Solar Reading'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
                {step === 'entry'
                  ? 'Record verified generation data from your inverter or solar monitoring app'
                  : 'Verify your solar generation parameters before saving'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '20px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #94a3b8)')}
          >
            ✕
          </button>
        </div>

        {/* STEP 1: ENTRY FORM */}
        {step === 'entry' && (
          <form onSubmit={handleReview} noValidate>
            {/* Period Selector Tabs */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Reporting Period
              </label>
              <div
                role="radiogroup"
                aria-label="Reporting Period"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                {(['day', 'week', 'month', 'year', 'lifetime', 'custom'] as SolarReportingPeriodType[]).map((p) => {
                  const isSelected = formState.periodType === p
                  const labelMap: Record<SolarReportingPeriodType, string> = {
                    day: 'Day',
                    week: 'Week',
                    month: 'Month',
                    year: 'Year',
                    lifetime: 'Lifetime',
                    custom: 'Custom Range',
                  }
                  return (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handlePeriodChange(p)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 800 : 600,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected
                          ? '1px solid var(--accent-orange, #ff8a1d)'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: isSelected
                          ? 'rgba(255, 138, 29, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? 'var(--accent-orange, #ff8a1d)' : 'var(--text-secondary, #cbd5e1)',
                      }}
                    >
                      {labelMap[p]}
                    </button>
                  )
                })}
              </div>
              {errors.periodType && (
                <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                  {errors.periodType}
                </span>
              )}
            </div>

            {/* Dynamic Date Controls based on Period */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '18px',
              }}
            >
              {/* Day Period Controls */}
              {formState.periodType === 'day' && (
                <div>
                  <label
                    htmlFor="solarInputDate"
                    style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                  >
                    Reading Date
                  </label>
                  <input
                    type="date"
                    id="solarInputDate"
                    name="solarDate"
                    value={formState.date}
                    onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(6, 17, 31, 0.8)',
                      border: errors.date ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  />
                  {errors.date && (
                    <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                      {errors.date}
                    </span>
                  )}
                </div>
              )}

              {/* Week Period Controls */}
              {formState.periodType === 'week' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label
                      htmlFor="solarWeekStart"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                    >
                      Week Start Date
                    </label>
                    <input
                      type="date"
                      id="solarWeekStart"
                      name="solarWeekStart"
                      value={formState.weekStartDate}
                      onChange={(e) => setFormState((prev) => ({ ...prev, weekStartDate: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(6, 17, 31, 0.8)',
                        border: errors.startDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                      }}
                    />
                    {errors.startDate && (
                      <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        {errors.startDate}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="solarWeekEnd"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                    >
                      Week End Date
                    </label>
                    <input
                      type="date"
                      id="solarWeekEnd"
                      name="solarWeekEnd"
                      value={formState.weekEndDate}
                      onChange={(e) => setFormState((prev) => ({ ...prev, weekEndDate: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(6, 17, 31, 0.8)',
                        border: errors.endDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                      }}
                    />
                    {errors.endDate && (
                      <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        {errors.endDate}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Month Period Controls */}
              {formState.periodType === 'month' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label
                      htmlFor="solarSelectMonth"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                    >
                      Month
                    </label>
                    <select
                      id="solarSelectMonth"
                      name="solarMonth"
                      value={formState.month}
                      onChange={(e) => setFormState((prev) => ({ ...prev, month: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(6, 17, 31, 0.8)',
                        border: errors.startDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {MONTH_NAMES.map((m) => (
                        <option key={m} value={m} style={{ background: '#08182a', color: '#FFFFFF' }}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="solarInputYear"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                    >
                      Year
                    </label>
                    <input
                      type="number"
                      id="solarInputYear"
                      name="solarYear"
                      min="2000"
                      max="2100"
                      value={formState.year}
                      onChange={(e) => setFormState((prev) => ({ ...prev, year: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(6, 17, 31, 0.8)',
                        border: errors.endDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Year Period Controls */}
              {formState.periodType === 'year' && (
                <div>
                  <label
                    htmlFor="solarYearOnly"
                    style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                  >
                    Annual Year
                  </label>
                  <input
                    type="number"
                    id="solarYearOnly"
                    name="solarYearOnly"
                    min="2000"
                    max="2100"
                    value={formState.year}
                    onChange={(e) => setFormState((prev) => ({ ...prev, year: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(6, 17, 31, 0.8)',
                      border: errors.endDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  />
                  {errors.endDate && (
                    <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                      {errors.endDate}
                    </span>
                  )}
                </div>
              )}

              {/* Lifetime Period Controls */}
              {formState.periodType === 'lifetime' && (
                <div>
                  <label
                    htmlFor="solarLifetimeAsOf"
                    style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                  >
                    As Of Date (Cumulative Total Through)
                  </label>
                  <input
                    type="date"
                    id="solarLifetimeAsOf"
                    name="solarLifetimeAsOf"
                    value={formState.lifetimeAsOfDate}
                    onChange={(e) => setFormState((prev) => ({ ...prev, lifetimeAsOfDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(6, 17, 31, 0.8)',
                      border: errors.date ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  />
                  {errors.date && (
                    <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                      {errors.date}
                    </span>
                  )}
                </div>
              )}

              {/* Custom Range Controls */}
              {formState.periodType === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label
                      htmlFor="solarCustomStart"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="solarCustomStart"
                      name="solarCustomStart"
                      value={formState.customStartDate}
                      onChange={(e) => setFormState((prev) => ({ ...prev, customStartDate: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(6, 17, 31, 0.8)',
                        border: errors.startDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                      }}
                    />
                    {errors.startDate && (
                      <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        {errors.startDate}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="solarCustomEnd"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '6px' }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      id="solarCustomEnd"
                      name="solarCustomEnd"
                      value={formState.customEndDate}
                      onChange={(e) => setFormState((prev) => ({ ...prev, customEndDate: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(6, 17, 31, 0.8)',
                        border: errors.endDate ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                      }}
                    />
                    {errors.endDate && (
                      <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        {errors.endDate}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Production Reading (kWh) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="manualSolarProductionInput"
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Solar Production</span>
                  <span style={{ color: 'var(--accent-orange, #ff8a1d)' }}>*</span>
                </label>
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                  Unit: kilowatt-hours (kWh)
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="manualSolarProductionInput"
                  name="productionKwh"
                  placeholder="e.g. 361.40"
                  value={formState.productionKwh}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormState((prev) => ({ ...prev, productionKwh: val }))
                    if (errors.productionKwh) {
                      setErrors((prev) => ({ ...prev, productionKwh: undefined }))
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 48px 10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(6, 17, 31, 0.9)',
                    border: errors.productionKwh ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                  aria-invalid={Boolean(errors.productionKwh)}
                  aria-describedby={errors.productionKwh ? 'productionError' : undefined}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--accent-green, #36d399)',
                    pointerEvents: 'none',
                  }}
                >
                  kWh
                </span>
              </div>
              {errors.productionKwh && (
                <span
                  id="productionError"
                  style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: 600 }}
                >
                  {errors.productionKwh}
                </span>
              )}
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', display: 'block', marginTop: '4px' }}>
                Total solar electricity generated by PV panels during the specified period.
              </span>
            </div>

            {/* Installed Capacity (kWp) - Optional */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="manualSolarCapacityInput"
                  style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)' }}
                >
                  Installed Solar Capacity (kWp)
                </label>
                <span
                  style={{
                    fontSize: '9px',
                    color: 'var(--text-muted, #94a3b8)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  OPTIONAL
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="manualSolarCapacityInput"
                  name="installedCapacityKwp"
                  placeholder="e.g. 3.60"
                  value={formState.installedCapacityKwp}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormState((prev) => ({ ...prev, installedCapacityKwp: val }))
                    if (errors.installedCapacityKwp) {
                      setErrors((prev) => ({ ...prev, installedCapacityKwp: undefined }))
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 48px 10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(6, 17, 31, 0.9)',
                    border: errors.installedCapacityKwp ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                  aria-invalid={Boolean(errors.installedCapacityKwp)}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--accent-blue, #17a8e5)',
                    pointerEvents: 'none',
                  }}
                >
                  kWp
                </span>
              </div>
              {errors.installedCapacityKwp && (
                <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                  {errors.installedCapacityKwp}
                </span>
              )}
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', display: 'block', marginTop: '4px' }}>
                The nameplate DC power capacity of your solar rooftop system.
              </span>
            </div>

            {/* Optional Daily Breakdown Accordion */}
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-orange, #ff8a1d)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0,
                }}
              >
                <span>{showDailyBreakdown ? '▼' : '►'}</span>
                <span>Optional: Daily Breakdown Points ({formState.dailyPoints.length})</span>
              </button>

              {showDailyBreakdown && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <p style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 8px' }}>
                    Record discrete daily production readings (kWh) for granular tracking.
                  </p>

                  {formState.dailyPoints.map((pt, idx) => (
                    <div
                      key={pt.id}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <input
                        type="date"
                        value={pt.date}
                        aria-label={`Daily reading date ${idx + 1}`}
                        onChange={(e) => handleUpdateDailyPoint(pt.id, 'date', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(6, 17, 31, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="kWh"
                        aria-label={`Daily production ${idx + 1}`}
                        value={pt.productionKwh || ''}
                        onChange={(e) =>
                          handleUpdateDailyPoint(
                            pt.id,
                            'productionKwh',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        style={{
                          width: '100px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(6, 17, 31, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDailyPoint(pt.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddDailyPoint}
                    style={{
                      marginTop: '6px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Daily Reading
                  </button>
                </div>
              )}
            </div>

            {/* Footer Form Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="calc-btn"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-secondary, #cbd5e1)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btnReviewSolarReading"
                className="calc-btn"
                style={{
                  background: 'var(--accent-orange, #ff8a1d)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Review Reading →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: REVIEW STATE */}
        {step === 'review' && reviewPayload && (
          <div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--accent-orange, #ff8a1d)',
                  }}
                >
                  Entered Reading Summary
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(54, 211, 153, 0.12)',
                    color: 'var(--accent-green, #36d399)',
                    border: '1px solid rgba(54, 211, 153, 0.25)',
                  }}
                >
                  Manual Entry
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(6, 17, 31, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Reporting Period
                  </span>
                  <span id="reviewPeriodSummary" style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'block', marginTop: '2px' }}>
                    {formatPeriodSummary(reviewPayload)}
                  </span>
                </div>

                <div style={{ background: 'rgba(6, 17, 31, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Date Span
                  </span>
                  <span id="reviewDateSpan" style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'block', marginTop: '2px' }}>
                    {reviewPayload.startDate === reviewPayload.endDate ? reviewPayload.startDate : `${reviewPayload.startDate} → ${reviewPayload.endDate}`}
                  </span>
                </div>

                <div style={{ background: 'rgba(6, 17, 31, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(54, 211, 153, 0.2)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Solar Production
                  </span>
                  <span id="reviewProdKwh" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-green, #36d399)', display: 'block', marginTop: '2px' }}>
                    {reviewPayload.productionKwh.toFixed(2)} kWh
                  </span>
                </div>

                <div style={{ background: 'rgba(6, 17, 31, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(23, 168, 229, 0.2)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Installed Capacity
                  </span>
                  <span id="reviewCapacityKwp" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-blue, #17a8e5)', display: 'block', marginTop: '2px' }}>
                    {reviewPayload.installedCapacityKwp != null ? `${reviewPayload.installedCapacityKwp.toFixed(2)} kWp` : 'Not Specified'}
                  </span>
                </div>
              </div>

              {reviewPayload.dailyPoints && reviewPayload.dailyPoints.length > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #cbd5e1)', marginTop: '8px' }}>
                  Includes <strong>{reviewPayload.dailyPoints.length}</strong> daily discrete readings recorded.
                </div>
              )}

              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  background: 'rgba(23, 168, 229, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(23, 168, 229, 0.2)',
                  fontSize: '10px',
                  color: 'var(--text-secondary, #cbd5e1)',
                  lineHeight: 1.4,
                }}
              >
                <strong>Engineering Notice:</strong> This solar generation record is isolated from grid electricity consumption. It will populate solar production metrics and system yield calculations.
              </div>
            </div>

            {/* Footer Review Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                id="btnEditManualReading"
                onClick={() => setStep('entry')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-secondary, #cbd5e1)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Edit Reading
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    padding: '8px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btnSaveManualReading"
                  onClick={handleSave}
                  style={{
                    background: 'var(--accent-orange, #ff8a1d)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 138, 29, 0.3)',
                  }}
                >
                  Save Reading
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
