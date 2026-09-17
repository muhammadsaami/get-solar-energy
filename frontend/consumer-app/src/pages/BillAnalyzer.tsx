import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  useBillAnalyzer,
  calculatePlantPerformance,
  calculateSpecificYield,
  calculateAverageDailyGeneration,
  checkPeriodCompatibility,
} from '../hooks/useBillAnalyzer'
import type { BillAnalysisData, SolarReportData, UnifiedEnergyData, PlantPerformanceResult, SolarReportState, BillQuotas, ManualBillInput } from '../hooks/billAnalyzer.types'
import type { ChartConfiguration } from 'chart.js'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  DoughnutController,
} from 'chart.js'
import {
  COST_BREAKDOWN_CHART_COLORS,
  HISTORY_CHART_STYLES,
  CHART_TOOLTIP_THEME,
  DEFAULT_MONTHS,
  MONTH_MULTIPLIERS,
} from '../hooks/billAnalyzer.constants'
import DashboardSprites from '../components/dashboard/DashboardSprites'
import { DEMO_BILL_ANALYZER_DATA } from '../data/billAnalyzerDemoData'
import DemoBanner from '../components/billAnalyzer/DemoBanner'
import DemoMetricExplainer, { DemoExplainerProvider } from '../components/billAnalyzer/DemoMetricExplainer'

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController)

export { checkPeriodCompatibility, calculateSpecificYield, calculateAverageDailyGeneration }

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val)
  return isFinite(n) ? n : fallback
}

function formatCurrency(val: number): string {
  return `₹${Math.round(val).toLocaleString('en-IN')}`
}

function formatCurrencyPerMonth(val: number): string {
  return `₹${Math.round(val).toLocaleString('en-IN')}/mo`
}

export function formatRupees(val: number): string {
  if (val % 1 !== 0) {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return formatCurrency(val)
}

export function formatKwhNumber(val: number | null | undefined): string {
  if (val == null || !isFinite(val)) return '—'
  if (val % 1 !== 0 || val === 0) {
    return val.toFixed(2)
  }
  return val.toString()
}

export function formatSolarKwh(val: number | null | undefined): string {
  if (val == null || !isFinite(val)) return '—'
  if (val % 1 === 0) return val.toString()
  const fixed2 = val.toFixed(2)
  return fixed2.endsWith('0') ? val.toFixed(1) : fixed2
}

export function formatKwNumber(val: number | null | undefined): string {
  if (val == null || !isFinite(val)) return '—'
  if (val % 1 === 0) return val.toString()
  const fixed2 = val.toFixed(2)
  return fixed2.endsWith('0') ? val.toFixed(1) : fixed2
}

export function getReportingPeriodText(month?: string | null, year?: string | number | null): string {
  if (month && year) return `${month} ${year}`
  if (month) return month
  if (year) return String(year)
  return '—'
}

function BillUploadCard({
  state,
  progress,
  error,
  quotas,
  onFile,
  onRetry,
  onSwitchToManual,
  onSeeExample,
}: {
  state: 'idle' | 'uploading' | 'complete' | 'error'
  progress: { percent: number; status: string }
  error: string | null
  quotas: BillQuotas | null
  onFile: (file: File) => void
  onRetry: () => void
  onSwitchToManual: () => void
  onSeeExample?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const uploadRemaining = quotas?.upload?.remaining ?? 3
  const uploadLimit = quotas?.upload?.limit ?? 3
  const isExhausted = uploadRemaining <= 0

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!isExhausted && e.dataTransfer.files.length > 0) onFile(e.dataTransfer.files[0])
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isExhausted && e.target.files && e.target.files.length > 0) onFile(e.target.files[0])
  }

  return (
    <div className="card-base upload-card" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="kpi-title">Upload Electricity Bill</span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(23,168,229,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
          {uploadRemaining} / {uploadLimit} left today
        </span>
      </div>

      {isExhausted ? (
        <div style={{ marginTop: '12px', padding: '16px', borderRadius: '8px', background: 'rgba(23,168,229,0.04)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-navy)', margin: '0 0 6px' }}>Daily upload limit reached</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: '1.5' }}>
            You've used all 3 bill-upload analyses for today.<br />
            You can use Manual Bill Analysis or try again tomorrow.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="calc-btn"
              onClick={onSwitchToManual}
              style={{ width: 'auto', padding: '6px 16px', fontSize: '11px', height: 'auto', margin: 0 }}
            >
              Enter Details Manually
            </button>
            {onSeeExample && (
              <button
                type="button"
                id="btnSeeExampleAnalysisExhausted"
                onClick={onSeeExample}
                className="demo-cta-link"
              >
                See Example Analysis
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            className="drag-drop-area"
            id="billDragDropArea"
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              marginTop: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: dragOver ? 'rgba(23,168,229,0.08)' : 'transparent',
              display: state === 'uploading' ? 'none' : 'block',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg className="upload-icon" style={{ width: '40px', height: '40px', marginBottom: '10px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '1.5' }} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text" style={{ fontSize: '12px', color: 'var(--text-navy)', margin: '0 0 4px' }}>
              Drag & drop your electricity bill here, or <span className="browse-link" style={{ color: 'var(--accent-blue)', fontWeight: '700', textDecoration: 'underline' }}>browse</span>
            </p>
            <input ref={fileInputRef} type="file" id="billFileInput" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" style={{ display: 'none' }} onChange={handleChange} />
            <span className="file-limits" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>PDF / PNG / JPG / JPEG / WEBP</span>
          </div>

          <div
            className="upload-progress-container"
            id="billUploadProgressBox"
            style={{
              display: state === 'uploading' ? 'block' : 'none',
              marginTop: '12px',
              background: 'var(--bg-input)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="progress-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <span id="billFileName" style={{ fontWeight: '700' }}>{progress.status ? 'Uploading...' : '-'}</span>
              <span id="billFileType" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Type: -</span>
              <span id="billFileSize" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Size: -</span>
            </div>
            <div className="progress-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', marginTop: '4px' }}>
              <span id="billUploadStatus" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{progress.status || 'Uploading...'}</span>
              <span id="billUploadPercent" style={{ fontWeight: '800', color: 'var(--accent-blue)' }}>{progress.percent}%</span>
            </div>
            <div className="progress-bar-track" style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', width: '100%' }}>
              <div className="progress-bar-fill" id="billUploadProgressFill" style={{ width: `${progress.percent}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.1s ease' }} />
            </div>
          </div>

          <div
            id="billAnalysisErrorBox"
            style={{
              display: state === 'error' ? 'block' : 'none',
              marginTop: '12px',
              padding: '10px',
              borderRadius: '6px',
              background: 'rgba(231,76,60,0.05)',
              border: '1px dashed rgba(231,76,60,0.25)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              {error || 'Analysis failed. Check the file or try again.'}
            </span>
            <button type="button" className="calc-btn" onClick={onRetry} style={{ margin: '0 auto', width: 'auto', padding: '5px 14px', fontSize: '11px', height: 'auto' }}>Retry Upload</button>
          </div>

          <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {uploadRemaining} analyses remaining today
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {onSeeExample && (
                <button
                  type="button"
                  id="btnSeeExampleAnalysis"
                  onClick={onSeeExample}
                  className="demo-cta-link"
                >
                  <svg style={{ width: '13px', height: '13px', stroke: 'currentColor', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>See Example Analysis</span>
                </button>
              )}
              <button
                type="button"
                className="calc-btn"
                onClick={onSwitchToManual}
                style={{ width: 'auto', padding: '5px 12px', fontSize: '11px', height: 'auto', background: 'transparent', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}
              >
                Can't upload your bill? Enter Details Manually
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ManualBillFormCard({
  state,
  progress,
  error,
  quotas,
  onSubmit,
  onSwitchToUpload,
  onSeeExample,
}: {
  state: 'idle' | 'uploading' | 'complete' | 'error'
  progress: { percent: number; status: string }
  error: string | null
  quotas: BillQuotas | null
  onSubmit: (data: ManualBillInput) => void
  onSwitchToUpload: () => void
  onSeeExample?: () => void
}) {
  const [billingPeriod, setBillingPeriod] = React.useState('')
  const [billAmount, setBillAmount] = React.useState('')
  const [monthlyUnits, setMonthlyUnits] = React.useState('')
  const [sanctionedLoad, setSanctionedLoad] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [consumerNumber, setConsumerNumber] = React.useState('')
  const [discom, setDiscom] = React.useState('')
  const [solarInstalled, setSolarInstalled] = React.useState(false)
  const [solarCapacity, setSolarCapacity] = React.useState('')
  const [solarGeneration, setSolarGeneration] = React.useState('')
  const [solarExport, setSolarExport] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  const manualRemaining = quotas?.manual?.remaining ?? 5
  const manualLimit = quotas?.manual?.limit ?? 5
  const isExhausted = manualRemaining <= 0
  const isLoading = state === 'uploading'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!billingPeriod.trim()) {
      setFormError('Billing period is required (e.g. October 2026).')
      return
    }
    const amt = parseFloat(billAmount)
    if (!amt || isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid bill amount greater than 0.')
      return
    }
    const units = parseFloat(monthlyUnits)
    if (!units || isNaN(units) || units <= 0) {
      setFormError('Please enter valid monthly units consumed greater than 0.')
      return
    }
    const load = parseFloat(sanctionedLoad)
    if (!load || isNaN(load) || load <= 0) {
      setFormError('Please enter a valid sanctioned load (kW) greater than 0.')
      return
    }

    const payload: ManualBillInput = {
      billing_period: billingPeriod.trim(),
      bill_amount: amt,
      monthly_units: units,
      sanctioned_load_kw: load,
      customer_name: customerName.trim() || undefined,
      consumer_number: consumerNumber.trim() || undefined,
      discom: discom.trim() || undefined,
      solar_installed: solarInstalled,
      solar_capacity_kw: solarInstalled && solarCapacity ? parseFloat(solarCapacity) : undefined,
      solar_generation_units: solarInstalled && solarGeneration ? parseFloat(solarGeneration) : undefined,
      solar_export_units: solarInstalled && solarExport ? parseFloat(solarExport) : undefined,
    }
    setIsEditing(false)
    onSubmit(payload)
  }

  return (
    <div className="card-base upload-card" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span className="kpi-title">Enter Bill Details Manually</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onSeeExample && (
            <button
              type="button"
              onClick={onSeeExample}
              className="demo-cta-link"
              style={{ padding: '3px 8px', fontSize: '10px' }}
            >
              See Example
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchToUpload}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Upload Bill Instead
          </button>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        {state === 'complete' && !isEditing ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '6px',
              background: 'rgba(54, 211, 153, 0.05)',
              border: '1px solid rgba(54, 211, 153, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(54, 211, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg style={{ width: '15px', height: '15px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '2.5' }} viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-green)', display: 'block' }}>
                  Bill Details Verified
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                  Manual bill details analyzed successfully • {manualRemaining} analyses remaining today
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="calc-btn"
                onClick={() => setIsEditing(true)}
                style={{ padding: '5px 12px', fontSize: '11px', height: 'auto', width: 'auto' }}
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={onSwitchToUpload}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Upload Bill Instead
              </button>
            </div>
          </div>
        ) : isExhausted ? (
          <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(23,168,229,0.04)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-navy)', margin: '0 0 6px' }}>Daily manual analysis limit reached</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: '1.5' }}>
              You've used all 5 manual bill analyses for today.<br />
              You can upload a bill if upload analyses remain, or try again tomorrow.
            </p>
            <button
              type="button"
              className="calc-btn"
              onClick={onSwitchToUpload}
              style={{ width: 'auto', padding: '6px 16px', fontSize: '11px', height: 'auto', margin: '0 auto' }}
            >
              Switch to Bill Upload
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Billing Period *
                </label>
                <input
                  type="text"
                  placeholder="e.g. June 2026"
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Bill Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 2450"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Units Consumed (kWh) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 280"
                  value={monthlyUnits}
                  onChange={(e) => setMonthlyUnits(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Sanctioned Load (kW) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  placeholder="e.g. 3"
                  value={sanctionedLoad}
                  onChange={(e) => setSanctionedLoad(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '12px' }}
                  required
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Optional Bill Details
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Discom / Board</label>
                  <input
                    type="text"
                    placeholder="e.g. UPPCL"
                    value={discom}
                    onChange={(e) => setDiscom(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Consumer Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 5109642660"
                    value={consumerNumber}
                    onChange={(e) => setConsumerNumber(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: 'rgba(255, 138, 29, 0.04)', border: '1px solid rgba(255, 138, 29, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)' }}>Already have solar installed?</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSolarInstalled(true)}
                    style={{
                      padding: '3px 12px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: solarInstalled ? '1px solid var(--accent-orange)' : '1px solid var(--border-color)',
                      background: solarInstalled ? 'var(--accent-orange)' : 'transparent',
                      color: solarInstalled ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolarInstalled(false)}
                    style={{
                      padding: '3px 12px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: !solarInstalled ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      background: !solarInstalled ? 'var(--accent-blue)' : 'transparent',
                      color: !solarInstalled ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    No
                  </button>
                </div>
              </div>

              {solarInstalled ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Capacity (kW)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="e.g. 3.0"
                      value={solarCapacity}
                      onChange={(e) => setSolarCapacity(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Generation (kWh)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 360"
                      value={solarGeneration}
                      onChange={(e) => setSolarGeneration(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Export (kWh)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 120"
                      value={solarExport}
                      onChange={(e) => setSolarExport(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-navy)', fontSize: '11px' }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {(formError || error) ? (
              <div style={{ marginTop: '10px', padding: '8px', borderRadius: '5px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', color: '#ef4444', fontSize: '11px', textAlign: 'center' }}>
                {formError || error}
              </div>
            ) : null}

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {manualRemaining} analyses remaining today
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {onSeeExample && (
                  <button
                    type="button"
                    onClick={onSeeExample}
                    className="demo-cta-link"
                  >
                    See Example Analysis
                  </button>
                )}
                <button
                  type="submit"
                  className="calc-btn"
                  disabled={isLoading}
                  style={{ width: 'auto', padding: '8px 24px', fontSize: '12px', height: 'auto' }}
                >
                  {isLoading ? (progress.status || 'Analyzing...') : 'Analyze Bill'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function SolarReportUploadCard({
  state,
  progress,
  error,
  solarReport,
  onFile,
  onRetry,
  onClear,
}: {
  state: SolarReportState
  progress: { percent: number; status: string }
  error: string | null
  solarReport?: SolarReportData | null
  onFile: (file: File) => void
  onRetry: () => void
  onClear?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) onFile(e.dataTransfer.files[0])
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onFile(e.target.files[0])
  }

  const isUploading = state === 'UPLOADING' || state === 'PROCESSING' || state === 'uploading'
  const isExtracted = state === 'EXTRACTED' || state === 'complete'
  const isError = state === 'EXTRACTION_FAILED' || state === 'INVALID_FILE' || state === 'API_ERROR' || state === 'error'

  return (
    <div className="card-base solar-report-upload-card" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <div>
            <span className="kpi-title">Upload Solar Production Report</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>Optional for existing solar installations</span>
          </div>
        </div>
        <span className="api-tag" style={{ background: 'rgba(255,138,29,0.08)', color: 'var(--accent-orange)', borderColor: 'rgba(255,138,29,0.2)' }}>OPTIONAL</span>
      </div>

      {isExtracted ? (
        <div
          style={{
            marginTop: '10px',
            padding: '12px 14px',
            borderRadius: '6px',
            background: 'rgba(255, 138, 29, 0.05)',
            border: '1px solid rgba(255, 138, 29, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 138, 29, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg style={{ width: '15px', height: '15px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2.5' }} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-orange)', display: 'block' }}>
                Solar Report Loaded
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                {solarReport
                  ? `${solarReport.productionKwh != null ? `${formatSolarKwh(solarReport.productionKwh)} kWh` : '—'} · ${solarReport.systemSizeKw != null ? `${formatKwNumber(solarReport.systemSizeKw)} kW` : '—'} · ${getReportingPeriodText(solarReport.month, solarReport.year)}`
                  : '— · — · —'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="calc-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '5px 12px', fontSize: '11px', height: 'auto', width: 'auto' }}
            >
              Replace
            </button>
            {onClear && (
              <button
                type="button"
                className="calc-btn"
                onClick={onClear}
                style={{ padding: '5px 12px', fontSize: '11px', height: 'auto', width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
              >
                Skip / Dismiss
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            id="solarReportFileInput"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
        </div>
      ) : (
        <>
          <div
            className="drag-drop-area"
            id="solarReportDragDropArea"
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-orange)' : 'rgba(255,138,29,0.3)'}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              marginTop: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: dragOver ? 'rgba(255,138,29,0.08)' : 'transparent',
              display: isUploading ? 'none' : 'block',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg className="upload-icon" style={{ width: '40px', height: '40px', marginBottom: '10px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '1.5' }} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text" style={{ fontSize: '12px', color: 'var(--text-navy)', margin: '0 0 4px' }}>
              Drag & drop solar report here, or <span className="browse-link" style={{ color: 'var(--accent-orange)', fontWeight: '700', textDecoration: 'underline' }}>browse</span>
            </p>
            <input ref={fileInputRef} type="file" id="solarReportFileInput" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" style={{ display: 'none' }} onChange={handleChange} />
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '3px' }}>Solar App Screenshot</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '3px' }}>Monthly Production Report</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '3px' }}>Inverter Report</span>
            </div>
            <span className="file-limits" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>PDF / PNG / JPG / JPEG / WEBP</span>
          </div>

          <div
            id="solarReportProgressBox"
            style={{
              display: isUploading ? 'block' : 'none',
              marginTop: '12px',
              background: 'var(--bg-input)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,138,29,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <span id="solarReportFileName" style={{ fontWeight: '700' }}>solar_report.png</span>
              <span id="solarReportFileType" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Type: -</span>
              <span id="solarReportFileSize" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Size: -</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
              <span id="solarReportStatus" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{progress.status || (state === 'PROCESSING' ? 'Processing Solar Yield Intelligence...' : 'Uploading Solar Report...')}</span>
              <span id="solarReportPercent" style={{ fontWeight: '800', color: 'var(--accent-orange)' }}>{progress.percent}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div id="solarReportProgressFill" style={{ width: `${progress.percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-orange), var(--accent-green))', transition: 'width 0.1s ease' }} />
            </div>
          </div>

          <div
            id="solarReportErrorBox"
            style={{
              display: isError ? 'block' : 'none',
              marginTop: '12px',
              padding: '12px',
              borderRadius: '6px',
              background: 'rgba(231,76,60,0.05)',
              border: '1px dashed rgba(231,76,60,0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444', fontWeight: '700' }}>
                {state === 'INVALID_FILE' ? 'Invalid File' : state === 'API_ERROR' ? 'Service Notice' : 'Report Extraction Notice'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '8px', fontWeight: '500', lineHeight: 1.4 }}>
              {error || 'Could not extract solar generation figures from this report. Please upload an inverter or app screenshot showing kWh generation.'}
            </span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="calc-btn"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click()
                  else onRetry()
                }}
                style={{ margin: '0', width: 'auto', padding: '5px 14px', fontSize: '11px', height: 'auto' }}
              >
                Upload Another Report
              </button>
              {onClear && (
                <button
                  type="button"
                  className="calc-btn"
                  onClick={onClear}
                  style={{ margin: '0', width: 'auto', padding: '5px 14px', fontSize: '11px', height: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                >
                  Dismiss (Skip Optional Report)
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatDetailValue(key: string, val: string | number): string {
  if (val === '-' || val === 'Not Available' || val === '' || val === null || val === undefined) return 'Not Available'
  const n = Number(val)
  if (!isFinite(n)) return String(val)
  switch (key) {
    case 'monthly_units': return `${Math.round(n)} kWh`
    case 'bill_amount': return formatCurrency(n)
    case 'per_unit_rate': return `₹${n} / kWh`
    case 'recommended_kw': return `${n} kW`
    case 'monthly_generation_units': return `${Math.round(n)} kWh`
    case 'monthly_savings_rs': return `${formatCurrency(n)} / mo`
    case 'system_cost_rs': return formatCurrency(n)
    case 'payback_years': return `${n} Years`
    case 'savings_25_years_rs': return formatCurrency(n)
    default: return String(val)
  }
}

interface CollapsibleSectionProps {
  id?: string
  title: string
  subtitle?: string
  badge?: React.ReactNode
  icon?: React.ReactNode
  defaultExpanded?: boolean
  children: React.ReactNode
  onToggle?: (expanded: boolean) => void
  themeColor?: string
}

function CollapsibleSection({
  id,
  title,
  subtitle,
  badge,
  icon,
  defaultExpanded = false,
  children,
  onToggle,
  themeColor = 'var(--accent-blue)',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  const toggle = () => {
    const next = !isExpanded
    setIsExpanded(next)
    onToggle?.(next)
  }

  return (
    <div
      id={id}
      className="card-base"
      style={{
        marginBottom: '10px',
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isExpanded}
        aria-controls={id ? `${id}-content` : undefined}
        style={{
          width: '100%',
          padding: '11px 14px',
          background: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          border: 'none',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          color: 'var(--text-navy)',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {icon && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)' }}>
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            flexShrink: 0,
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColor,
            fontSize: '12px',
            fontWeight: '700',
          }}
          aria-hidden="true"
        >
          {isExpanded ? '−' : '+'}
        </div>
      </button>
      <div
        id={id ? `${id}-content` : undefined}
        style={{
          display: isExpanded ? 'block' : 'none',
          padding: '12px 14px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function AnalysisResults({
  analysis,
  solarReport,
  unifiedEnergy,
  isDemo = false,
}: {
  analysis: BillAnalysisData
  solarReport: SolarReportData | null
  unifiedEnergy: UnifiedEnergyData | null
  isDemo?: boolean
}) {
  const d = analysis
  const potentialScore = d.payback_years && d.payback_years > 0
    ? Math.round(Math.min(98, Math.max(50, 100 - (d.payback_years * 7))))
    : null

  const isSolarConsumer = d.isSolarConsumer && (d.importUnits != null || d.exportUnits != null)
  const perfResult: PlantPerformanceResult | null = solarReport && solarReport.systemSizeKw && solarReport.productionKwh
    ? calculatePlantPerformance(solarReport.productionKwh, solarReport.systemSizeKw, solarReport.month, solarReport.year)
    : null

  const specificYield = calculateSpecificYield(solarReport?.productionKwh, solarReport?.systemSizeKw)
  const averageDailyGen = calculateAverageDailyGeneration(solarReport?.productionKwh, solarReport?.month, solarReport?.year)

  // 1. Authoritative Primary Energy Source Figures
  const gridImportKwh = d.importUnits != null ? d.importUnits : (d.gridImport != null ? d.gridImport : (d.monthly_units > 0 ? d.monthly_units : null))
  const gridExportKwh = d.exportUnits != null ? d.exportUnits : (d.gridExport != null ? d.gridExport : null)
  const solarGenKwh = solarReport && solarReport.productionKwh != null ? solarReport.productionKwh : null

  // 2. Period Compatibility
  const isPeriodCompatible = checkPeriodCompatibility(d.billing_period, solarReport?.month, solarReport?.year)

  // 3. Derived Metrics (Calculated ONLY when source periods are compatible and values valid)
  const solarSelfConsumptionKwh = (isPeriodCompatible && solarGenKwh != null && gridExportKwh != null)
    ? Math.max(0, solarGenKwh - gridExportKwh)
    : null

  const selfConsumptionRate = (isPeriodCompatible && solarGenKwh != null && solarGenKwh > 0 && solarSelfConsumptionKwh != null)
    ? Math.round((solarSelfConsumptionKwh / solarGenKwh) * 1000) / 10
    : null

  const exportRate = (isPeriodCompatible && solarGenKwh != null && solarGenKwh > 0 && gridExportKwh != null)
    ? Math.round((gridExportKwh / solarGenKwh) * 1000) / 10
    : null

  const netGridEnergyKwh = (gridImportKwh != null && gridExportKwh != null)
    ? (gridImportKwh - gridExportKwh)
    : null

  // 4. Net-Metering Credit Information
  const openingSolarSurplus = d.openingSolarSurplus != null ? d.openingSolarSurplus : null
  const closingSolarSurplus = d.closingSolarSurplus != null ? d.closingSolarSurplus : null
  const netBilledUnits = d.netBilledUnits != null ? d.netBilledUnits : null
  const expectedClosingSurplus = (openingSolarSurplus != null && netGridEnergyKwh != null)
    ? (openingSolarSurplus - netGridEnergyKwh)
    : null

  // 5. Financial Figures (Separate from Energy Flow)
  const currentBillAmt = d.bill_amount
  const savingsPotential = d.monthly_savings_rs

  const detailFields = [
    { label: 'Customer Name', value: d.customer_name, key: 'customer_name', id: 'resCustomerName' },
    { label: 'Consumer Number', value: d.consumer_number, key: 'consumer_number', id: 'resConsumerNumber' },
    { label: 'Electricity Company', value: d.discom, key: 'discom', id: 'resElectricityCompany' },
    { label: 'Billing Period', value: d.billing_period, key: 'billing_period', id: 'resBillingPeriod' },
    { label: 'Monthly Units Consumed', value: d.monthly_units, key: 'monthly_units', id: 'resMonthlyUnits' },
    { label: 'Bill Amount', value: d.bill_amount, key: 'bill_amount', id: 'resBillAmount' },
    { label: 'Per Unit Rate', value: d.per_unit_rate, key: 'per_unit_rate', id: 'resPerUnitRate' },
    { label: 'Recommended Solar Size', value: d.recommended_kw, key: 'recommended_kw', id: 'resRecommendedSolarSize' },
    { label: 'Monthly Generation', value: d.monthly_generation_units, key: 'monthly_generation_units', id: 'resMonthlyGeneration' },
    { label: 'Monthly Savings', value: d.monthly_savings_rs, key: 'monthly_savings_rs', id: 'resMonthlySavings' },
    { label: 'Estimated System Cost', value: d.system_cost_rs, key: 'system_cost_rs', id: 'resSystemCost' },
    { label: 'Payback Period', value: d.payback_years, key: 'payback_years', id: 'resPaybackPeriod' },
  ]

  const solarUtilFields = [
    { label: isSolarConsumer ? 'Solar Generated' : 'Projected Solar Generation', value: `${d.monthlySolarGeneration.toFixed(1)} kWh`, id: 'resSolarGenerated' },
    { label: isSolarConsumer ? 'Annual Solar Generation' : 'Projected Annual Generation', value: `${Math.round(d.annualSolarGeneration).toLocaleString('en-IN')} kWh/year`, id: 'resAnnualSolarGeneration' },
    { label: isSolarConsumer ? 'Solar Used Directly' : 'Estimated Direct Usage', value: `${d.solarUsedDirectly.toFixed(1)} kWh`, id: 'resSolarUsedDirectly' },
    { label: isSolarConsumer ? 'Exported To Grid' : 'Estimated Grid Export', value: `${d.solarExportedToGrid.toFixed(1)} kWh`, id: 'resExportedToGrid' },
    { label: isSolarConsumer ? 'Solar Offset' : 'Estimated Solar Offset', value: `${d.solarOffsetPercent.toFixed(1)}%`, id: 'resSolarOffsetPercent', valueColor: 'var(--accent-blue)' },
    { label: isSolarConsumer ? 'Grid Dependency' : 'Estimated Grid Dependency', value: `${d.gridDependency.toFixed(1)} kWh`, id: 'resGridDependency', valueColor: 'var(--accent-orange)' },
  ]

  const unifiedFields = unifiedEnergy ? [
    { label: 'Solar Generated', value: `${safeNum(unifiedEnergy.solarGenerated).toFixed(2)} kWh`, id: 'uniSolarGenerated', color: 'var(--accent-green)' },
    { label: 'Grid Import', value: `${safeNum(unifiedEnergy.gridImport).toFixed(1)} kWh`, id: 'uniGridImport', color: 'var(--accent-blue)' },
    { label: 'Grid Export', value: unifiedEnergy.gridExport != null ? `${safeNum(unifiedEnergy.gridExport).toFixed(1)} kWh` : '—', id: 'uniGridExport', color: 'var(--accent-blue)' },
    { label: 'Solar Used Directly', value: unifiedEnergy.solarUsedDirectly != null ? `${safeNum(unifiedEnergy.solarUsedDirectly).toFixed(1)} kWh` : '—', id: 'uniSolarUsedDirectly', color: 'var(--accent-green)' },
    { label: 'Self Consumption', value: unifiedEnergy.selfConsumptionPct != null ? `${unifiedEnergy.selfConsumptionPct}%` : '—', id: 'uniSelfConsumptionPct', color: 'var(--accent-green)' },
    { label: 'Solar Offset %', value: unifiedEnergy.solarOffsetPct != null ? `${unifiedEnergy.solarOffsetPct}%` : '—', id: 'uniSolarOffsetPct', color: 'var(--accent-blue)' },
    { label: 'Grid Dependency', value: unifiedEnergy.gridDependencyPct != null ? `${unifiedEnergy.gridDependencyPct}%` : '—', id: 'uniGridDependency', color: 'var(--accent-orange)' },
    { label: 'Net Metering Benefit', value: unifiedEnergy.netMeteringBenefit != null ? `${formatCurrencyPerMonth(unifiedEnergy.netMeteringBenefit)}` : '—', id: 'uniNetMeteringBenefit', color: 'var(--accent-green)' },
  ] : []

  return (
    <div id="billAnalysisResults" style={{ display: 'block' }}>
      {/* 0. PRIMARY ENERGY FLOW INTELLIGENCE */}
      <div className="energy-intelligence-section" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', letterSpacing: '0.3px', display: 'block' }}>
              Energy Flow & Grid Intelligence
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
              Authoritative meter readings, solar generation & verified net-metering balance
            </span>
          </div>
          {isPeriodCompatible ? (
            <span style={{ fontSize: '9px', background: 'rgba(54, 211, 153, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(54, 211, 153, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              PERIOD SYNCHRONIZED ({solarReport?.month} {solarReport?.year ?? ''})
            </span>
          ) : solarReport && (solarReport.productionKwh != null || solarReport.month) ? (
            <span style={{ fontSize: '9px', background: 'rgba(255, 138, 29, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 138, 29, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              PERIOD MISMATCH ({solarReport.month ?? 'Report'} vs Bill)
            </span>
          ) : null}
        </div>

        {/* PRIMARY ENERGY CARDS */}
        <div
          className="primary-energy-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          {/* Card 1: Grid Import */}
          <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229', padding: '12px 14px', background: 'rgba(23, 168, 229, 0.03)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span className="kpi-title" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grid Import</span>
                {isDemo && <DemoMetricExplainer metricKey="gridImport" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--accent-blue)', background: 'rgba(23,168,229,0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>METER</span>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="resPrimaryGridImport" style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-navy)' }}>
                {gridImportKwh != null ? `${formatKwhNumber(gridImportKwh)} kWh` : '—'}
              </span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Electricity drawn from grid
            </p>
          </div>

          {/* Card 2: Grid Export */}
          <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29', padding: '12px 14px', background: 'rgba(255, 138, 29, 0.03)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span className="kpi-title" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grid Export</span>
                {isDemo && <DemoMetricExplainer metricKey="gridExport" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--accent-orange)', background: 'rgba(255,138,29,0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>METER</span>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="resPrimaryGridExport" style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-navy)' }}>
                {gridExportKwh != null ? `${formatKwhNumber(gridExportKwh)} kWh` : '—'}
              </span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Solar energy sent to grid
            </p>
          </div>

          {/* Card 3: Solar Generation */}
          <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153', padding: '12px 14px', background: 'rgba(54, 211, 153, 0.03)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span className="kpi-title" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solar Generation</span>
                {isDemo && <DemoMetricExplainer metricKey="solarGeneration" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--accent-green)', background: 'rgba(54,211,153,0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>REPORT</span>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="resPrimarySolarGen" style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)' }}>
                {solarGenKwh != null ? `${formatKwhNumber(solarGenKwh)} kWh` : '—'}
              </span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Energy produced by solar system
            </p>
          </div>

          {/* Card 4: Solar Self-Consumption */}
          <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153', padding: '12px 14px', background: 'rgba(54, 211, 153, 0.03)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span className="kpi-title" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solar Self-Consumption</span>
                {isDemo && <DemoMetricExplainer metricKey="solarSelfConsumption" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>DERIVED</span>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="resPrimarySelfConsumption" style={{ fontSize: '18px', fontWeight: '900', color: solarSelfConsumptionKwh != null ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {solarSelfConsumptionKwh != null ? `${formatKwhNumber(solarSelfConsumptionKwh)} kWh` : '—'}
              </span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              {isPeriodCompatible && solarSelfConsumptionKwh != null
                ? 'Solar energy used directly'
                : solarReport && !isPeriodCompatible
                ? 'Period mismatch: solar report and bill periods differ'
                : 'Upload solar report to calculate direct consumption'}
            </p>
          </div>
        </div>

        {/* DERIVED ENERGY SUMMARY ROW */}
        <div
          className="derived-metrics-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Solar Self-Consumption Rate</span>
                {isDemo && <DemoMetricExplainer metricKey="selfConsumptionRate" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Calculated (Direct Usage / Generation)</span>
            </div>
            <span id="resDerivedSelfConsumptionRate" style={{ fontSize: '13px', fontWeight: '800', color: selfConsumptionRate != null ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {selfConsumptionRate != null ? `${selfConsumptionRate.toFixed(1)}%` : '—'}
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Solar Export Rate</span>
                {isDemo && <DemoMetricExplainer metricKey="exportRate" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Calculated (Grid Export / Generation)</span>
            </div>
            <span id="resDerivedExportRate" style={{ fontSize: '13px', fontWeight: '800', color: exportRate != null ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
              {exportRate != null ? `${exportRate.toFixed(1)}%` : '—'}
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Net Grid Energy</span>
                {isDemo && <DemoMetricExplainer metricKey="netGridEnergy" compact />}
              </div>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Calculated (Grid Import − Grid Export)</span>
            </div>
            <span id="resDerivedNetGridEnergy" style={{ fontSize: '13px', fontWeight: '800', color: netGridEnergyKwh != null ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
              {netGridEnergyKwh != null ? `${formatKwhNumber(netGridEnergyKwh)} kWh` : '—'}
            </span>
          </div>
        </div>

        {/* NET-METERING SUMMARY & FINANCIAL SUMMARY */}
        <div className="net-meter-financial-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '10px' }}>
          {/* Net-Metering Ledger */}
          <div className="card-base" style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-navy)', letterSpacing: '0.4px' }}>
                Net-Metering Credit Information
              </span>
              <span style={{ fontSize: '8px', color: 'var(--accent-green)', background: 'rgba(54,211,153,0.1)', padding: '1px 6px', borderRadius: '3px', fontWeight: '700' }}>
                DISCOM LEDGER
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Opening Surplus</span>
                  {isDemo && <DemoMetricExplainer metricKey="openingSurplus" compact />}
                </div>
                <span id="resNetMeterOpeningSurplus" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-navy)', display: 'block', marginTop: '2px' }}>
                  {openingSolarSurplus != null ? `${formatKwhNumber(openingSolarSurplus)} kWh` : '—'}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Net Grid Energy</span>
                  {isDemo && <DemoMetricExplainer metricKey="netGridEnergy" compact />}
                </div>
                <span id="resNetMeterNetGridEnergy" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }}>
                  {netGridEnergyKwh != null ? `${formatKwhNumber(netGridEnergyKwh)} kWh` : '—'}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Closing Surplus</span>
                  {isDemo && <DemoMetricExplainer metricKey="closingSurplus" compact />}
                </div>
                <span id="resNetMeterClosingSurplus" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-green)', display: 'block', marginTop: '2px' }}>
                  {closingSolarSurplus != null ? `${formatKwhNumber(closingSolarSurplus)} kWh` : '—'}
                </span>
              </div>
              <div style={{ background: 'rgba(54,211,153,0.04)', padding: '6px 4px', borderRadius: '4px', border: '1px solid rgba(54,211,153,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--accent-green)', textTransform: 'uppercase', fontWeight: '700' }}>Net Billed Units</span>
                  {isDemo && <DemoMetricExplainer metricKey="netBilledUnits" compact />}
                </div>
                <span id="resNetMeterBilledUnits" style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent-green)', display: 'block', marginTop: '2px' }}>
                  {netBilledUnits != null ? `${formatKwhNumber(netBilledUnits)} kWh` : '—'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
              <span>Distinction: <strong>Net Grid Energy</strong> ({netGridEnergyKwh != null ? `${formatKwhNumber(netGridEnergyKwh)} kWh` : '—'} physical) vs <strong>Net Billed Units</strong> ({netBilledUnits != null ? `${formatKwhNumber(netBilledUnits)} kWh` : '—'} invoiced)</span>
              {openingSolarSurplus != null && netGridEnergyKwh != null && closingSolarSurplus != null ? (
                <span id="resNetMeterReconciliation" style={{ color: 'var(--accent-green)', fontWeight: '700' }}>
                  {formatKwhNumber(openingSolarSurplus)} − {formatKwhNumber(netGridEnergyKwh)} = {formatKwhNumber(expectedClosingSurplus)} kWh ✓
                </span>
              ) : null}
            </div>
          </div>

          {/* Financial Summary (Separated) */}
          <div className="card-base" style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-navy)', letterSpacing: '0.4px' }}>
                Financial Summary
              </span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '3px', fontWeight: '700' }}>
                SEPARATE BILLING
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255, 138, 29, 0.03)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Current Bill</span>
                  {isDemo && <DemoMetricExplainer metricKey="billAmount" compact />}
                </div>
                <span id="resFinancialCurrentBill" style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-navy)', display: 'block', marginTop: '2px' }}>
                  {currentBillAmt > 0 ? formatRupees(currentBillAmt) : '—'}
                </span>
              </div>
              <div style={{ background: 'rgba(54, 211, 153, 0.03)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Solar Savings Potential</span>
                  {isDemo && <DemoMetricExplainer metricKey="potentialSavings" compact />}
                </div>
                <span id="resFinancialSavingsPotential" style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent-green)', display: 'block', marginTop: '2px' }}>
                  {savingsPotential > 0 ? formatCurrencyPerMonth(savingsPotential) : '—'}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '6px 0 0', textAlign: 'center' }}>
              Financial figures calculated independently from Discom tariff schedule.
            </p>
          </div>
        </div>

        {/* SOLAR ENERGY FLOW VISUALIZATION */}
        <div
          id="secSolarEnergyFlow"
          className="card-base"
          style={{
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-navy)', letterSpacing: '0.4px' }}>
              Solar Energy Flow Diagram
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              Physical generation distribution and grid import
            </span>
          </div>

          <div className="energy-flow-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', alignItems: 'stretch' }}>
            {/* Solar Generation Branch */}
            <div style={{ background: 'rgba(54, 211, 153, 0.03)', border: '1px solid rgba(54, 211, 153, 0.2)', borderRadius: '6px', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                  Solar Generation
                </span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-green)' }}>
                  {solarGenKwh != null ? `${formatKwhNumber(solarGenKwh)} kWh` : '—'}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', margin: '3px 0' }}>
                │ splits into
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Direct Self-Consumption</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-green)', display: 'block', margin: '1px 0' }}>
                    {solarSelfConsumptionKwh != null ? `${formatKwhNumber(solarSelfConsumptionKwh)} kWh` : '—'}
                  </span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block' }}>→ Powers Home</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Grid Export</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-orange)', display: 'block', margin: '1px 0' }}>
                    {gridExportKwh != null ? `${formatKwhNumber(gridExportKwh)} kWh` : '—'}
                  </span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block' }}>→ Sent to Grid</span>
                </div>
              </div>
            </div>

            {/* Grid Supply Branch */}
            <div style={{ background: 'rgba(23, 168, 229, 0.03)', border: '1px solid rgba(23, 168, 229, 0.2)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                  Grid Supply
                </span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-blue)' }}>
                  {gridImportKwh != null ? `${formatKwhNumber(gridImportKwh)} kWh` : '—'}
                </span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px 8px', textAlign: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Grid Import</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', margin: '2px 0' }}>
                  {gridImportKwh != null ? `${formatKwhNumber(gridImportKwh)} kWh` : '—'}
                </span>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block' }}>→ Powers Home (Discom Grid)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 1. Collapsible: Electricity Bill Analysis & Recommendations */}
      <CollapsibleSection
        id="secBillDetails"
        title="Bill Details & Recommendations"
        subtitle="Verified bill breakdown • Discom tariff, sanctioned load & 25-yr financial returns"
        defaultExpanded={false}
        themeColor="var(--accent-green)"
        badge={
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', background: 'var(--accent-green)', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>BILL VERIFIED</span>
            <span id="resExtractionConfidenceBadge" className={`confidence-badge ${d.extractionConfidence.badgeClass}`}>{d.extractionConfidence.label}</span>
          </div>
        }
        icon={
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <polyline points="22 11.08 20 11.08 17 22 12 1 7 22 4 11.08 2 11.08" />
          </svg>
        }
      >
        {/* Premium Summary Snapshot */}
        <div className="card-base" style={{ '--card-theme': '54, 211, 153', marginBottom: '12px', padding: '10px 12px', background: 'rgba(54, 211, 153, 0.04)', border: '1px solid rgba(54, 211, 153, 0.25)' } as React.CSSProperties}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Solar Potential</span><span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-green)', display: 'block', marginTop: '2px' }} id="snapSolarPotential">{potentialScore != null ? `${potentialScore}/100` : '—'}</span></div>
            <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>System Size</span><span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} id="snapSystemSize">{d.recommended_kw ? `${d.recommended_kw} kW` : '—'}</span></div>
            <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Annual Savings</span><span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} id="snapAnnualSavings">{d.monthly_savings_rs ? formatCurrency(d.monthly_savings_rs * 12) : '—'}</span></div>
            <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Payback</span><span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-orange)', display: 'block', marginTop: '2px' }} id="snapPaybackPeriod">{d.payback_years != null && d.payback_years > 0 ? `${d.payback_years} Yrs` : '—'}</span></div>
          </div>
        </div>

        {/* Extracted Bill Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {detailFields.map((field) => (
            <div key={field.key} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>{field.label}</span>
              <span
                id={field.id}
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: ['recommended_kw', 'monthly_generation_units'].includes(field.key) ? 'var(--accent-blue)' :
                         field.key === 'monthly_savings_rs' ? 'var(--accent-green)' :
                         ['system_cost_rs', 'payback_years'].includes(field.key) ? 'var(--accent-orange)' : 'var(--text-navy)',
                  display: 'block',
                }}
              >
                {formatDetailValue(field.key, field.value)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(54, 211, 153, 0.04)', border: '1px dashed rgba(54, 211, 153, 0.3)', padding: '8px 12px', borderRadius: '4px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-navy)' }}>25-Year Cumulative Savings:</span>
          <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent-green)' }} id="res25YearSavings">{d.savings_25_years_rs ? formatCurrency(d.savings_25_years_rs) : 'Not Available'}</span>
        </div>
      </CollapsibleSection>

      {/* 2. Collapsible: Solar Utilization Intelligence */}
      <CollapsibleSection
        id="secSolarUtil"
        title={isSolarConsumer ? 'Solar Utilization Summary' : 'Projected Solar Utilization (Estimated)'}
        subtitle="Monthly/annual generation, direct self-consumption & grid export breakdown"
        defaultExpanded={false}
        themeColor="var(--accent-orange)"
        icon={
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        }
      >
        <div className="solar-util-grid">
          {solarUtilFields.map((item) => (
            <div key={item.id} className="card-base" style={{ padding: '10px', background: 'rgba(23, 168, 229, 0.02)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: (item as { valueColor?: string }).valueColor || 'var(--text-navy)', display: 'block' }} id={item.id}>{item.value}</span>
            </div>
          ))}
          <div className="card-base" style={{ padding: '10px', gridColumn: 'span 2', background: 'rgba(54, 211, 153, 0.02)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Net Metering Benefit</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent-green)', display: 'block' }} id="resNetMeteringBenefit">{formatCurrencyPerMonth(Math.round(d.netMeteringBenefit))}</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* 3. Collapsible: Solar Consumer Intelligence */}
      <CollapsibleSection
        id="secSolarConsumerIntel"
        title="Consumer Profile Summary"
        subtitle="Solar installation status, import/export units & net metering credit"
        defaultExpanded={false}
        themeColor="var(--accent-blue)"
        icon={
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        }
      >
        <div className="solar-util-grid">
          <div className="card-base" style={{ '--card-theme': '255, 138, 29', padding: '10px', gridColumn: 'span 2', background: 'rgba(255, 138, 29, 0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Solar Installed</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resSolarInstalled">{isSolarConsumer ? 'Yes' : 'No'}</span>
          </div>
          {isSolarConsumer ? (
            <>
              <div className="card-base" style={{ padding: '10px', background: 'rgba(23, 168, 229, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Import Units</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resImportUnits">{d.importUnits != null ? `${d.importUnits.toFixed(1)} kWh` : '-'}</span>
              </div>
              <div className="card-base" style={{ padding: '10px', background: 'rgba(23, 168, 229, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Export Units</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resExportUnits">{d.exportUnits != null ? `${d.exportUnits.toFixed(1)} kWh` : '-'}</span>
              </div>
              <div className="card-base" style={{ padding: '10px', background: 'rgba(255, 138, 29, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Net Consumption</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-orange)', display: 'block' }} id="resNetConsumption">{d.netConsumption ? `${d.netConsumption.toFixed(1)} kWh` : '-'}</span>
              </div>
              <div className="card-base" style={{ padding: '10px', background: 'rgba(54, 211, 153, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Net Metering Credit</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)', display: 'block' }} id="resNetMeterCredit">{formatCurrency(Math.round(d.netMeteringCredit))}</span>
              </div>
            </>
          ) : null}
        </div>
      </CollapsibleSection>

      {/* 4. Collapsible: Plant Performance Intelligence */}
      {solarReport ? (
        <CollapsibleSection
          id="secPlantPerformance"
          title="Plant Performance"
          subtitle="Authoritative solar production metrics & efficiency analysis"
          defaultExpanded={false}
          themeColor="var(--accent-orange)"
          badge={
            <span className={`plant-perf-badge ${perfResult?.ratingClass || 'perf-neutral'}`} id="resPlantPerformanceRating">
              {perfResult?.rating || '—'}
            </span>
          }
          icon={
            <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        >
          {/* Group 1: SOURCE VALUES (Extracted directly from uploaded report) */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Extracted Report Data
              </span>
              <span style={{ fontSize: '8px', color: 'var(--accent-green)', background: 'rgba(54, 211, 153, 0.1)', padding: '1px 6px', borderRadius: '3px', fontWeight: '700' }}>
                SOURCE
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '10px', background: 'rgba(54,211,153,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Monthly Generation</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-green)', display: 'block' }} id="resProdKwh">
                  {solarReport.productionKwh != null ? `${formatSolarKwh(solarReport.productionKwh)} kWh` : '—'}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '10px', background: 'rgba(23,168,229,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>System Capacity</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdSystemSize">
                  {solarReport.systemSizeKw != null ? `${formatKwNumber(solarReport.systemSizeKw)} kW` : '—'}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '10px', background: 'rgba(23,168,229,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Reporting Period</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdMonth">
                  {getReportingPeriodText(solarReport.month, solarReport.year)}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '255, 138, 29', padding: '10px', background: 'rgba(255,138,29,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Production Source</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-orange)', display: 'block' }} id="resProdSource">
                  {solarReport.source || '—'}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '10px', background: 'rgba(54,211,153,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Daily Generation</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdDailyGeneration">
                  {solarReport.dailyGenerationKwh != null ? `${formatSolarKwh(solarReport.dailyGenerationKwh)} kWh` : '—'}
                </span>
              </div>
              {solarReport.confidence != null ? (
                <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '10px', background: 'rgba(23,168,229,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Extraction Confidence</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-blue)', display: 'block' }} id="resProdConfidence">
                    {typeof solarReport.confidence === 'number' ? `${Math.round(solarReport.confidence <= 1 ? solarReport.confidence * 100 : solarReport.confidence)}%` : String(solarReport.confidence)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Group 2: DERIVED METRICS (Calculated from valid source data) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Derived Performance Analysis
              </span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 6px', borderRadius: '3px', fontWeight: '700' }}>
                DERIVED
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '10px', background: 'rgba(54,211,153,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Specific Yield</span>
                  {isDemo && <DemoMetricExplainer metricKey="specificYield" compact />}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)', display: 'block' }} id="resProdSpecificYield">
                  {specificYield != null ? `${specificYield.toFixed(1)} kWh/kWp` : '—'}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '10px', background: 'rgba(23,168,229,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Average Daily Gen</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdAvgDailyGen">
                  {averageDailyGen != null ? `${averageDailyGen.toFixed(1)} kWh/day` : '—'}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '255, 138, 29', padding: '10px', background: 'rgba(255,138,29,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Expected Generation</span>
                  {isDemo && <DemoMetricExplainer metricKey="expectedGeneration" compact />}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdExpected">
                  {perfResult?.expected != null ? `${Math.round(perfResult.expected).toLocaleString('en-IN')} kWh` : '—'}
                </span>
              </div>
              <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '10px', background: 'rgba(54,211,153,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Performance</span>
                  {isDemo && <DemoMetricExplainer metricKey="performancePct" compact />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)', display: 'block' }} id="resPlantPerformancePercent">
                    {perfResult?.pct != null ? `${perfResult.pct}%` : '—'}
                  </span>
                  {perfResult?.rating ? (
                    <span className={`plant-perf-badge ${perfResult.ratingClass}`}>{perfResult.rating}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <div className="solar-util-section plant-performance-section" id="secPlantPerformance" style={{ display: 'none' }} />
      )}

      {/* 5. Collapsible: Unified Energy Intelligence */}
      {unifiedEnergy ? (
        <CollapsibleSection
          id="secUnifiedEnergy"
          title="Unified Energy Summary"
          subtitle="Cross-analyzed solar generation, direct consumption & grid dependency"
          defaultExpanded={false}
          themeColor="var(--accent-blue)"
          badge={
            <span style={{ fontSize: '8px', background: 'linear-gradient(135deg,var(--accent-orange),var(--accent-green))', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: '700' }}>LIVE</span>
          }
          icon={
            <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
        >
          <div className="solar-util-grid">
            {unifiedFields.map((item) => (
              <div key={item.id} className="card-base" style={{ padding: '10px', background: 'rgba(23, 168, 229, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: item.color, display: 'block' }} id={item.id}>{item.value}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* 6. Collapsible: Bill Health & Cost Driver Analysis */}
      <CollapsibleSection
        id="secBillCostBreakdown"
        title="Bill Health & Cost Driver Analysis"
        subtitle="Cost driver insights, efficiency score & potential savings distribution"
        defaultExpanded={false}
        themeColor="var(--accent-blue)"
        onToggle={(expanded) => {
          if (expanded) {
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
          }
        }}
        icon={
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
          <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '12px', textAlign: 'center', background: 'rgba(23, 168, 229, 0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Bill Health Score</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-navy)', display: 'block' }} id="resBillHealthScore">{d.billHealth ? `${d.billHealth.score}/100` : '-'}</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-blue)', display: 'block', marginTop: '4px' }} id="resBillHealthRating">{d.billHealth?.rating || '-'}</span>
          </div>
          <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '12px', textAlign: 'center', background: 'rgba(54, 211, 153, 0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Solar Opportunity Score</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-navy)', display: 'block' }} id="resSolarOpportunityScore">{d.solarOpportunity ? `${d.solarOpportunity.score}/100` : '-'}</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-green)', display: 'block', marginTop: '4px' }} id="resSolarOpportunityRating">{d.solarOpportunity?.rating || '-'}</span>
          </div>
        </div>

        <div className="chart-breakdown-container">
          <div style={{ height: '150px', position: 'relative' }}>
            <canvas id="billCostBreakdownChart"></canvas>
          </div>
        </div>
        <div className="chart-insight-box" style={{ marginTop: '10px' }}>
          <div className="chart-insight-item">
            <span className="chart-insight-label">Top Cost Driver:</span>
            <span className="chart-insight-val" id="resTopCostDriver">
              {isDemo ? 'Energy Charges (~70%)' : '-'}
            </span>
          </div>
          <div className="chart-insight-item">
            <span className="chart-insight-label">Potential Savings:</span>
            <span className="chart-insight-val" id="resPotentialSavingsText">
              {isDemo ? '₹2,835 / month (~82%)' : '-'}
            </span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}

export default function BillAnalyzer() {
  const {
    analysis,
    solarReport,
    unifiedEnergy,
    billUploadState,
    solarUploadState,
    billProgress,
    solarProgress,
    billError,
    solarError,
    quotas,
    handleBillFile,
    handleSolarFile,
    retryBillUpload,
    retrySolarUpload,
    clearSolarReport,
    submitManualBill,
  } = useBillAnalyzer()

  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload')
  const [isDemoMode, setIsDemoMode] = useState(false)

  const demoCostChartRef = useRef<ChartJS | null>(null)
  const demoHistoryChartRef = useRef<ChartJS | null>(null)

  const destroyDemoCharts = useCallback(() => {
    if (demoCostChartRef.current) {
      demoCostChartRef.current.destroy()
      demoCostChartRef.current = null
    }
    if (demoHistoryChartRef.current) {
      demoHistoryChartRef.current.destroy()
      demoHistoryChartRef.current = null
    }
  }, [])

  const initDemoCharts = useCallback((billAmount: number, monthlySavings: number) => {
    destroyDemoCharts()

    // 1. Cost Breakdown Doughnut
    const costCanvas = document.getElementById('billCostBreakdownChart') as HTMLCanvasElement | null
    if (costCanvas) {
      const existingCost = ChartJS.getChart(costCanvas)
      if (existingCost) existingCost.destroy()

      const ctx = costCanvas.getContext('2d')
      if (ctx) {
        const energyCost = Math.round(billAmount * 0.70)
        const fixedCharges = Math.round(billAmount * 0.15)
        const taxes = Math.max(0, billAmount - energyCost - fixedCharges)

        const config: ChartConfiguration<'doughnut'> = {
          type: 'doughnut',
          data: {
            labels: ['Energy Charges', 'Fixed Charges', 'Taxes & Cess'],
            datasets: [{
              data: [energyCost, fixedCharges, taxes],
              backgroundColor: COST_BREAKDOWN_CHART_COLORS.backgroundColor,
              borderWidth: 2,
              borderColor: '#060f1f',
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { size: 10, family: 'Outfit' }, boxWidth: 10, padding: 8 },
              },
              tooltip: CHART_TOOLTIP_THEME,
            },
          },
        }
        demoCostChartRef.current = new ChartJS(ctx, config)
      }
    }

    // 2. History Bar Chart
    const historyCanvas = document.getElementById('billHistoryChart') as HTMLCanvasElement | null
    if (historyCanvas) {
      const existingHistory = ChartJS.getChart(historyCanvas)
      if (existingHistory) existingHistory.destroy()

      const ctx = historyCanvas.getContext('2d')
      if (ctx) {
        const historical = MONTH_MULTIPLIERS.map(m => Math.round(billAmount * m))
        const withSolar = historical.map(b => Math.round(b * 0.25))

        const config: ChartConfiguration<'bar'> = {
          type: 'bar',
          data: {
            labels: DEFAULT_MONTHS,
            datasets: [
              {
                label: 'Grid Bill Without Solar (₹)',
                data: historical,
                backgroundColor: HISTORY_CHART_STYLES.billBackground,
                borderColor: HISTORY_CHART_STYLES.billBorder,
                borderWidth: 1,
                borderRadius: 4,
              },
              {
                label: 'Projected Bill With Solar (₹)',
                data: withSolar,
                backgroundColor: HISTORY_CHART_STYLES.savingsBackground,
                borderColor: HISTORY_CHART_STYLES.savingsBorder,
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#94a3b8', font: { size: 10, family: 'Outfit' } },
              },
              y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 10, family: 'Outfit' },
                  callback: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
                },
              },
            },
            plugins: {
              legend: {
                position: 'top',
                labels: { color: '#94a3b8', font: { size: 10, family: 'Outfit' }, boxWidth: 10, padding: 8 },
              },
              tooltip: {
                ...CHART_TOOLTIP_THEME,
                callbacks: {
                  label: (item) => ` ${item.dataset.label}: ₹${Number(item.raw).toLocaleString('en-IN')}`,
                },
              },
            },
          },
        }
        demoHistoryChartRef.current = new ChartJS(ctx, config)
      }
    }
  }, [destroyDemoCharts])

  useEffect(() => {
    if (isDemoMode) {
      const billAmount = DEMO_BILL_ANALYZER_DATA.analysis.bill_amount
      const monthlySavings = DEMO_BILL_ANALYZER_DATA.analysis.monthly_savings_rs

      const timer = setTimeout(() => {
        initDemoCharts(billAmount, monthlySavings)
      }, 100)

      return () => {
        clearTimeout(timer)
        destroyDemoCharts()
      }
    } else {
      destroyDemoCharts()
    }
  }, [isDemoMode, initDemoCharts, destroyDemoCharts])

  const effectiveAnalysis = isDemoMode ? DEMO_BILL_ANALYZER_DATA.analysis : analysis
  const effectiveSolarReport = isDemoMode ? DEMO_BILL_ANALYZER_DATA.solarReport : solarReport
  const effectiveUnifiedEnergy = isDemoMode ? DEMO_BILL_ANALYZER_DATA.unifiedEnergy : unifiedEnergy

  const d = effectiveAnalysis

  return (
    <>
      <DashboardSprites />
      <DemoExplainerProvider>
        <div className="tab-content active" role="tabpanel" aria-label="bill analyzer" id="tab-bill-analyzer">
        <div className="tab-header-block" style={{ marginBottom: '14px' }}>
          <h2 className="tab-heading">Bill Analyzer</h2>
          <p className="tab-subheading">Analyze your electricity bill & discover optimal solar capacity requirements.</p>
        </div>

        {/* DEMO MODE BANNER */}
        {isDemoMode && (
          <DemoBanner onExitDemo={() => setIsDemoMode(false)} />
        )}

        {/* PRIMARY CUSTOMER METRICS — IMMEDIATELY VISIBLE ABOVE THE FOLD */}
        <div
          className="primary-kpis-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29', padding: '12px 14px' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="kpi-title">Current Monthly Bill</span>
                {isDemoMode && <DemoMetricExplainer metricKey="billAmount" compact />}
              </div>
              <svg className="kpi-title-icon orange"><use href="#icon-electricity-consumption" xlinkHref="#icon-electricity-consumption" /></svg>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="billTabCurrentBill">{d && d.bill_amount > 0 ? formatRupees(d.bill_amount) : '—'}</span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isDemoMode
                ? 'Sample baseline bill before solar installation'
                : d && d.bill_amount > 0 ? 'Extracted from latest billing cycle' : 'No bill data available'}
            </p>
          </div>
          <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229', padding: '12px 14px' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="kpi-title">Monthly Units / Grid Import</span>
                {isDemoMode && <DemoMetricExplainer metricKey="gridImport" compact />}
              </div>
              <svg className="kpi-title-icon blue"><use href="#icon-bill" xlinkHref="#icon-bill" /></svg>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="billTabUnits">
                {(() => {
                  const kwh = d ? (d.importUnits != null ? d.importUnits : (d.monthly_units > 0 ? d.monthly_units : null)) : null
                  return kwh != null ? `${formatKwhNumber(kwh)} kWh` : '—'
                })()}
              </span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isDemoMode
                ? 'Sample metered grid consumption: 380 kWh'
                : d && (d.importUnits != null || d.monthly_units > 0) ? `Grid import: ${formatKwhNumber(d.importUnits != null ? d.importUnits : d.monthly_units)} kWh` : 'No consumption data'}
            </p>
          </div>
          <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153', padding: '12px 14px' } as React.CSSProperties}>
            <div className="kpi-header-row" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="kpi-title">Solar Savings Potential</span>
                {isDemoMode && <DemoMetricExplainer metricKey="potentialSavings" compact />}
              </div>
              <svg className="kpi-title-icon green"><use href="#icon-annual-savings" xlinkHref="#icon-annual-savings" /></svg>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="billTabSavings">{d && d.monthly_savings_rs > 0 ? formatCurrencyPerMonth(d.monthly_savings_rs) : '—'}</span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isDemoMode
                ? 'Sample projected monthly dividend: ₹2,835/mo (~82% reduction)'
                : d && d.monthly_savings_rs > 0
                ? (d.bill_amount > 0 ? `Equivalent to ~${Math.round((d.monthly_savings_rs / d.bill_amount) * 100)}% reduction` : 'Solar savings potential calculated')
                : 'Savings calculated upon bill extraction'}
            </p>
          </div>
        </div>

        {/* INPUT / DOCUMENT STATUS — COMPACT SIDE-BY-SIDE GRID */}
        {!isDemoMode && (
          <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', alignItems: 'start' }}>
            <div>
              {inputMode === 'upload' ? (
                <BillUploadCard
                  state={billUploadState}
                  progress={billProgress}
                  error={billError}
                  quotas={quotas}
                  onFile={handleBillFile}
                  onRetry={retryBillUpload}
                  onSwitchToManual={() => setInputMode('manual')}
                  onSeeExample={() => setIsDemoMode(true)}
                />
              ) : (
                <ManualBillFormCard
                  state={billUploadState}
                  progress={billProgress}
                  error={billError}
                  quotas={quotas}
                  onSubmit={submitManualBill}
                  onSwitchToUpload={() => setInputMode('upload')}
                  onSeeExample={() => setIsDemoMode(true)}
                />
              )}
            </div>
            <div>
              <SolarReportUploadCard
                state={solarUploadState}
                progress={solarProgress}
                error={solarError}
                solarReport={solarReport}
                onFile={handleSolarFile}
                onRetry={retrySolarUpload}
                onClear={clearSolarReport}
              />
            </div>
          </div>
        )}

        {/* DETAILED ANALYSIS */}
        {effectiveAnalysis ? (
          <AnalysisResults
            analysis={effectiveAnalysis}
            solarReport={effectiveSolarReport}
            unifiedEnergy={effectiveUnifiedEnergy}
            isDemo={isDemoMode}
          />
        ) : billUploadState === 'uploading' ? (
          <div id="billAnalysisResults" style={{ display: 'block' }}>
            {[
              'snapSolarPotential', 'snapSystemSize', 'snapAnnualSavings', 'snapPaybackPeriod',
              'resCustomerName', 'resConsumerNumber', 'resElectricityCompany', 'resBillingPeriod',
              'resMonthlyUnits', 'resBillAmount', 'resPerUnitRate', 'resRecommendedSolarSize',
              'resMonthlyGeneration', 'resMonthlySavings', 'resSystemCost', 'resPaybackPeriod',
              'res25YearSavings',
              'resSolarGenerated', 'resAnnualSolarGeneration', 'resSolarUsedDirectly', 'resExportedToGrid',
              'resSolarOffsetPercent', 'resGridDependency', 'resNetMeteringBenefit',
              'resSolarInstalled', 'resImportUnits', 'resExportUnits', 'resNetConsumption', 'resNetMeterCredit',
              'resBillHealthScore', 'resBillHealthRating', 'resSolarOpportunityScore', 'resSolarOpportunityRating',
              'resTopCostDriver', 'resPotentialSavingsText',
              'resPrimaryGridImport', 'resPrimaryGridExport', 'resPrimarySolarGen', 'resPrimarySelfConsumption',
              'resDerivedSelfConsumptionRate', 'resDerivedExportRate', 'resDerivedNetGridEnergy',
              'resNetMeterOpeningSurplus', 'resNetMeterNetGridEnergy', 'resNetMeterClosingSurplus', 'resNetMeterBilledUnits',
              'resFinancialCurrentBill', 'resFinancialSavingsPotential',
            ].map(id => (
              <span key={id} id={id} style={{ display: 'none' }}>
                <span className="skeleton-loader" />
              </span>
            ))}
          </div>
        ) : null}

        {/* Historical Consumption & Potential Savings Trend */}
        {effectiveAnalysis && effectiveAnalysis.bill_amount > 0 ? (
          <CollapsibleSection
            id="secBillHistoryCard"
            title="Historical Consumption & Potential Savings Trend"
            subtitle="12-month projected grid bill comparison with and without solar"
            themeColor="var(--accent-blue)"
            defaultExpanded={false}
            onToggle={(expanded) => {
              if (expanded) {
                setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
              }
            }}
            icon={
              <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            }
          >
            <div style={{ height: '220px', position: 'relative' }}>
              <canvas id="billHistoryChart"></canvas>
            </div>
          </CollapsibleSection>
        ) : null}

        {/* BOTTOM CALL-TO-ACTION IN DEMO MODE */}
        {isDemoMode && (
          <div
            className="card-base"
            style={{
              marginTop: '16px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(23, 168, 229, 0.08) 0%, rgba(54, 211, 153, 0.05) 100%)',
              border: '1px solid rgba(23, 168, 229, 0.3)',
              textAlign: 'center',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-navy)', margin: '0 0 6px' }}>
              Ready to analyze your own electricity bill?
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Upload your PDF or image bill to receive your custom solar capacity recommendation, tariff breakdown, and 25-year financial projection.
            </p>
            <button
              type="button"
              id="btnAnalyzeMyBillBottom"
              className="calc-btn"
              onClick={() => setIsDemoMode(false)}
              style={{ margin: '0 auto', width: 'auto', padding: '8px 24px', fontSize: '12px' }}
            >
              Analyze My Bill
            </button>
          </div>
        )}
      </div>
      </DemoExplainerProvider>
    </>
  )
}
