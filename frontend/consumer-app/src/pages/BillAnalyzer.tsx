import React, { useRef } from 'react'
import { useBillAnalyzer, calculatePlantPerformance } from '../hooks/useBillAnalyzer'
import type { BillAnalysisData, SolarReportData, UnifiedEnergyData, PlantPerformanceResult } from '../hooks/billAnalyzer.types'
import DashboardSprites from '../components/dashboard/DashboardSprites'

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

function BillUploadCard({
  state,
  progress,
  error,
  onFile,
  onRetry,
}: {
  state: 'idle' | 'uploading' | 'complete' | 'error'
  progress: { percent: number; status: string }
  error: string | null
  onFile: (file: File) => void
  onRetry: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) onFile(e.dataTransfer.files[0])
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onFile(e.target.files[0])
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
      </div>

      {state === 'complete' ? (
        <div
          className="drag-drop-area"
          style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', marginTop: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="upload-icon" style={{ width: '48px', height: '48px', marginBottom: '12px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '1.5' }} viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: '700', margin: '0' }}>Bill Verified & Extracted!</p>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click to upload another bill</span>
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" style={{ display: 'none' }} onChange={handleChange} />
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
        </>
      )}
    </div>
  )
}

function SolarReportUploadCard({
  state,
  progress,
  error,
  onFile,
  onRetry,
}: {
  state: 'idle' | 'uploading' | 'complete' | 'error'
  progress: { percent: number; status: string }
  error: string | null
  onFile: (file: File) => void
  onRetry: () => void
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
          <span className="kpi-title">Upload Solar Production Report</span>
        </div>
        <span className="api-tag" style={{ background: 'rgba(255,138,29,0.08)', color: 'var(--accent-orange)', borderColor: 'rgba(255,138,29,0.2)' }}>SCANNED</span>
      </div>

      {state === 'complete' ? (
        <div
          className="drag-drop-area"
          style={{ border: '2px dashed rgba(255,138,29,0.3)', borderRadius: '8px', padding: '24px', textAlign: 'center', marginTop: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="upload-icon" style={{ width: '44px', height: '44px', marginBottom: '10px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '1.5' }} viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p style={{ fontSize: '13px', color: 'var(--accent-orange)', fontWeight: '700', margin: '0' }}>Solar Report Loaded!</p>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click to upload another report</span>
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" style={{ display: 'none' }} onChange={handleChange} />
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
              display: state === 'uploading' ? 'none' : 'block',
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
              display: state === 'uploading' ? 'block' : 'none',
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
              <span id="solarReportStatus" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{progress.status || 'Analyzing Solar Production...'}</span>
              <span id="solarReportPercent" style={{ fontWeight: '800', color: 'var(--accent-orange)' }}>{progress.percent}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div id="solarReportProgressFill" style={{ width: `${progress.percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-orange), var(--accent-green))', transition: 'width 0.1s ease' }} />
            </div>
          </div>

          <div
            id="solarReportErrorBox"
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
              {error || 'Could not read solar report. Try another file.'}
            </span>
            <button type="button" className="calc-btn" onClick={onRetry} style={{ margin: '0 auto', width: 'auto', padding: '5px 14px', fontSize: '11px', height: 'auto' }}>Retry Upload</button>
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

function AnalysisResults({
  analysis,
  solarReport,
  unifiedEnergy,
}: {
  analysis: BillAnalysisData
  solarReport: SolarReportData | null
  unifiedEnergy: UnifiedEnergyData | null
}) {
  const d = analysis
  const potentialScore = d.payback_years ? Math.round(Math.min(98, Math.max(60, 100 - (d.payback_years * 7)))) : 92

  const isSolarConsumer = d.isSolarConsumer && d.importUnits != null
  const perfResult: PlantPerformanceResult | null = solarReport && solarReport.systemSizeKw && solarReport.productionKwh
    ? calculatePlantPerformance(solarReport.productionKwh, solarReport.systemSizeKw)
    : null

  const detailFields = [
    { label: 'Customer Name', value: d.customer_name, key: 'customer_name' },
    { label: 'Consumer Number', value: d.consumer_number, key: 'consumer_number' },
    { label: 'Electricity Company', value: d.discom, key: 'discom' },
    { label: 'Billing Period', value: d.billing_period, key: 'billing_period' },
    { label: 'Monthly Units Consumed', value: d.monthly_units, key: 'monthly_units' },
    { label: 'Bill Amount', value: d.bill_amount, key: 'bill_amount' },
    { label: 'Per Unit Rate', value: d.per_unit_rate, key: 'per_unit_rate' },
    { label: 'Recommended Solar Size', value: d.recommended_kw, key: 'recommended_kw' },
    { label: 'Monthly Generation', value: d.monthly_generation_units, key: 'monthly_generation_units' },
    { label: 'Monthly Savings', value: d.monthly_savings_rs, key: 'monthly_savings_rs' },
    { label: 'Estimated System Cost', value: d.system_cost_rs, key: 'system_cost_rs' },
    { label: 'Payback Period', value: d.payback_years, key: 'payback_years' },
  ]

  const solarUtilFields = [
    { label: 'Solar Generated', value: `${d.monthlySolarGeneration.toFixed(1)} kWh`, id: 'resSolarGenerated' },
    { label: 'Annual Solar Generation', value: `${Math.round(d.annualSolarGeneration).toLocaleString('en-IN')} kWh/year`, id: 'resAnnualSolarGeneration' },
    { label: 'Solar Used Directly', value: `${d.solarUsedDirectly.toFixed(1)} kWh`, id: 'resSolarUsedDirectly' },
    { label: 'Exported To Grid', value: `${d.solarExportedToGrid.toFixed(1)} kWh`, id: 'resExportedToGrid' },
    { label: 'Solar Offset', value: `${d.solarOffsetPercent.toFixed(1)}%`, id: 'resSolarOffsetPercent', valueColor: 'var(--accent-blue)' },
    { label: 'Grid Dependency', value: `${d.gridDependency.toFixed(1)} kWh`, id: 'resGridDependency', valueColor: 'var(--accent-orange)' },
  ]

  const unifiedFields = unifiedEnergy ? [
    { label: 'Solar Generated', value: `${safeNum(unifiedEnergy.solarGenerated).toFixed(2)} kWh`, id: 'uniSolarGenerated', color: 'var(--accent-green)' },
    { label: 'Grid Import', value: `${safeNum(unifiedEnergy.gridImport).toFixed(1)} kWh`, id: 'uniGridImport', color: 'var(--accent-blue)' },
    { label: 'Grid Export', value: `${safeNum(unifiedEnergy.gridExport).toFixed(1)} kWh`, id: 'uniGridExport', color: 'var(--accent-blue)' },
    { label: 'Solar Used Directly', value: `${safeNum(unifiedEnergy.solarUsedDirectly).toFixed(1)} kWh`, id: 'uniSolarUsedDirectly', color: 'var(--accent-green)' },
    { label: 'Self Consumption', value: `${unifiedEnergy.selfConsumptionPct}%`, id: 'uniSelfConsumptionPct', color: 'var(--accent-green)' },
    { label: 'Solar Offset %', value: `${unifiedEnergy.solarOffsetPct}%`, id: 'uniSolarOffsetPct', color: 'var(--accent-blue)' },
    { label: 'Grid Dependency', value: `${unifiedEnergy.gridDependencyPct}%`, id: 'uniGridDependency', color: 'var(--accent-orange)' },
    { label: 'Net Metering Benefit', value: `${formatCurrencyPerMonth(unifiedEnergy.netMeteringBenefit)}`, id: 'uniNetMeteringBenefit', color: 'var(--accent-green)' },
  ] : []

  return (
    <div id="billAnalysisResults" style={{ display: 'block' }}>
      {/* Premium Summary Snapshot */}
      <div className="card-base" style={{ '--card-theme': '54, 211, 153', marginBottom: '15px', padding: '12px 14px', background: 'rgba(54, 211, 153, 0.04)', border: '1px solid rgba(54, 211, 153, 0.25)' } as React.CSSProperties}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(54, 211, 153, 0.15)', paddingBottom: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analysis Summary</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', background: 'var(--accent-green)', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>EXTRACTED</span>
            <span id="resExtractionConfidenceBadge" className={`confidence-badge ${d.extractionConfidence.badgeClass}`}>{d.extractionConfidence.label}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
          <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Solar Potential</span><span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-green)', display: 'block', marginTop: '2px' }} id="snapSolarPotential">{potentialScore}/100</span></div>
          <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>System Size</span><span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} id="snapSystemSize">{d.recommended_kw ? `${d.recommended_kw} kW` : 'Not Available'}</span></div>
          <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Annual Savings</span><span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} id="snapAnnualSavings">{d.monthly_savings_rs ? formatCurrency(d.monthly_savings_rs * 12) : 'Not Available'}</span></div>
          <div><span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Payback</span><span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-orange)', display: 'block', marginTop: '2px' }} id="snapPaybackPeriod">{d.payback_years ? `${d.payback_years} Yrs` : 'Not Available'}</span></div>
        </div>
      </div>

      {/* Extracted Bill Details */}
      <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '2' }}><polyline points="22 11.08 20 11.08 17 22 12 1 7 22 4 11.08 2 11.08" /></svg>
        Bill Details & Recommendations
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {detailFields.map((field) => (
          <div key={field.key} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>{field.label}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: ['recommended_kw', 'monthly_generation_units'].includes(field.key) ? 'var(--accent-blue)' :
                     field.key === 'monthly_savings_rs' ? 'var(--accent-green)' :
                     ['system_cost_rs', 'payback_years'].includes(field.key) ? 'var(--accent-orange)' : 'var(--text-navy)',
              display: 'block',
            }}>{formatDetailValue(field.key, field.value)}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(54, 211, 153, 0.04)', border: '1px dashed rgba(54, 211, 153, 0.3)', padding: '8px 12px', borderRadius: '4px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-navy)' }}>25-Year Cumulative Savings:</span>
        <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent-green)' }} id="res25YearSavings">{d.savings_25_years_rs ? formatCurrency(d.savings_25_years_rs) : 'Not Available'}</span>
      </div>

      {/* Solar Utilization Intelligence */}
      <div className="solar-util-section">
        <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
Solar Utilization Summary
        </h3>
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
      </div>

      {/* Solar Consumer Intelligence */}
      <div className="solar-util-section" id="secSolarConsumerIntel">
        <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
Consumer Profile Summary
        </h3>
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
      </div>

      {/* Plant Performance Intelligence */}
      {perfResult && solarReport ? (
        <div className="solar-util-section plant-performance-section" id="secPlantPerformance">
          <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
Plant Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
            <div className="card-base" style={{ '--card-theme': '255, 138, 29', padding: '10px', background: 'rgba(255,138,29,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Source App</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-orange)', display: 'block' }} id="resProdSource">{solarReport.source || 'Solar App'}</span>
            </div>
            <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '10px', background: 'rgba(23,168,229,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Report Month</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdMonth">{solarReport.month && solarReport.year ? `${solarReport.month} ${solarReport.year}` : 'Not Available'}</span>
            </div>
            <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '10px', background: 'rgba(54,211,153,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Actual Production</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-green)', display: 'block' }} id="resProdKwh">{solarReport.productionKwh != null ? `${safeNum(solarReport.productionKwh).toFixed(2)} kWh` : 'Not Available'}</span>
            </div>
            <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '10px', background: 'rgba(23,168,229,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>System Size</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdSystemSize">{solarReport.systemSizeKw != null ? `${safeNum(solarReport.systemSizeKw).toFixed(1)} kW` : 'Not Available'}</span>
            </div>
            <div className="card-base" style={{ '--card-theme': '255, 138, 29', padding: '10px', background: 'rgba(255,138,29,0.02)', border: '1px solid var(--border-color)' } as React.CSSProperties}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Expected Generation</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-navy)', display: 'block' }} id="resProdExpected">{perfResult ? `${Math.round(perfResult.expected).toLocaleString('en-IN')} kWh` : 'N/A'}</span>
            </div>
            <div className="card-base" style={{ '--card-theme': '54, 211, 153', padding: '10px', background: 'rgba(54,211,153,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as React.CSSProperties}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Performance</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)', display: 'block' }} id="resPlantPerformancePercent">{perfResult ? `${perfResult.pct}%` : '-'}</span>
                <span className={`plant-perf-badge ${perfResult.ratingClass}`} id="resPlantPerformanceRating">{perfResult.rating || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="solar-util-section plant-performance-section" id="secPlantPerformance" style={{ display: 'none' }} />
      )}

      {/* Unified Energy Intelligence */}
      {unifiedEnergy ? (
        <div className="solar-util-section unified-energy-section" id="secUnifiedEnergy">
          <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
Energy Summary
            <span style={{ fontSize: '8px', background: 'linear-gradient(135deg,var(--accent-orange),var(--accent-green))', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: '700', marginLeft: '4px' }}>LIVE</span>
          </h3>
          <div className="solar-util-grid">
            {unifiedFields.map((item) => (
              <div key={item.id} className="card-base" style={{ padding: '10px', background: 'rgba(23, 168, 229, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: item.color, display: 'block' }} id={item.id}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Intelligence Scores Deck */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
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

      {/* Bill Cost Breakdown */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }} id="secBillCostBreakdown">
        <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
          Bill Cost Breakdown
        </h3>
        <div className="chart-breakdown-container">
          <div style={{ height: '150px', position: 'relative' }}>
            <canvas id="billCostBreakdownChart"></canvas>
          </div>
        </div>
        <div className="chart-insight-box">
          <div className="chart-insight-item">
            <span className="chart-insight-label">Top Cost Driver:</span>
            <span className="chart-insight-val" id="resTopCostDriver">-</span>
          </div>
          <div className="chart-insight-item">
            <span className="chart-insight-label">Potential Savings:</span>
            <span className="chart-insight-val" id="resPotentialSavingsText">-</span>
          </div>
        </div>
      </div>
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
    handleBillFile,
    handleSolarFile,
    retryBillUpload,
    retrySolarUpload,
  } = useBillAnalyzer()

  const d = analysis

  return (
    <>
      <DashboardSprites />
      <div className="tab-content active" role="tabpanel" aria-label="bill analyzer" id="tab-bill-analyzer">
      <div className="tab-header-block">
        <h2 className="tab-heading">Bill Analyzer</h2>
        <p className="tab-subheading">Analyze your electricity bill & discover optimal solar capacity requirements.</p>
      </div>

      <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', marginBottom: '20px' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <BillUploadCard state={billUploadState} progress={billProgress} error={billError} onFile={handleBillFile} onRetry={retryBillUpload} />
          <SolarReportUploadCard state={solarUploadState} progress={solarProgress} error={solarError} onFile={handleSolarFile} onRetry={retrySolarUpload} />

          {analysis ? (
            <AnalysisResults analysis={analysis} solarReport={solarReport} unifiedEnergy={unifiedEnergy} />
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
              ].map(id => (
                <span key={id} id={id} style={{ display: 'none' }}>
                  <span className="skeleton-loader" />
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN — KPI STACK */}
        <div className="kpis-stack-column" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
            <div className="kpi-header-row">
              <span className="kpi-title">Current Monthly Bill</span>
              <svg className="kpi-title-icon orange"><use href="#icon-electricity-consumption" xlinkHref="#icon-electricity-consumption" /></svg>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="billTabCurrentBill">{d && d.bill_amount > 0 ? formatCurrency(d.bill_amount) : '—'}</span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {d && d.bill_amount > 0 ? 'Extracted from latest billing cycle' : 'No bill data available'}
            </p>
          </div>
          <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
            <div className="kpi-header-row">
              <span className="kpi-title">Monthly Units Consumed</span>
              <svg className="kpi-title-icon blue"><use href="#icon-bill" xlinkHref="#icon-bill" /></svg>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="billTabUnits">{d && d.monthly_units > 0 ? `${Math.round(d.monthly_units)} kWh` : '—'}</span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {d && d.monthly_units > 0 ? `Average consumption: ${Math.round((d.monthly_units / 30) * 10) / 10} kWh/day` : 'No consumption data'}
            </p>
          </div>
          <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
            <div className="kpi-header-row">
              <span className="kpi-title">Solar Savings Potential</span>
              <svg className="kpi-title-icon green"><use href="#icon-annual-savings" xlinkHref="#icon-annual-savings" /></svg>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text" id="billTabSavings">{d && d.monthly_savings_rs > 0 ? formatCurrencyPerMonth(d.monthly_savings_rs) : '—'}</span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {d && d.monthly_savings_rs > 0 ? `Equivalent to ~${d.bill_amount > 0 ? Math.round((d.monthly_savings_rs / d.bill_amount) * 100) : 75}% reduction` : 'Savings calculated upon bill extraction'}
            </p>
          </div>
        </div>
      </div>

      {/* Full-width chart */}
      {analysis && analysis.bill_amount > 0 ? (
        <div className="card-base chart-fullwidth-card" style={{ marginTop: '20px', '--card-theme': '23, 168, 229' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title">Historical Consumption & Potential Savings Trend</span>
          </div>
          <div style={{ height: '250px', position: 'relative' }}>
            <canvas id="billHistoryChart"></canvas>
          </div>
        </div>
      ) : null}
      </div>
    </>
  )
}
