import React from 'react'
import { useROICalculator } from '../hooks/useROICalculator'
import ROIResultsGrid from '../components/roi/ROIResultsGrid'
import ROIDetailedSpecs from '../components/roi/ROIDetailedSpecs'
import ROIChart from '../components/roi/ROIChart'

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--color-orange)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ROICalculatorPage() {
  const {
    formData,
    result,
    status,
    error,
    chartData,
    hasCalculated,
    setMonthlyBill,
    setSunHours,
    setSystemSize,
    setPanelQuality,
    calculate,
    reset,
  } = useROICalculator()

  const handleMonthlyBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (!isNaN(v)) setMonthlyBill(v)
  }

  const handleSunHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (!isNaN(v)) setSunHours(v)
  }

  const handleSystemSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (!isNaN(v)) setSystemSize(v)
  }

  const handlePanelQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPanelQuality(e.target.value as 'mono' | 'poly' | 'bifacial')
  }

  const handleCalculate = () => {
    calculate()
  }

  const handleReset = () => {
    reset()
  }

  const isLoading = status === 'loading'

  return (
    <div className="ew-page">
      {/* ── 2-Column Asymmetric Workbench ── */}
      <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        {/* LEFT COLUMN: Input Form Card */}
        <div className="card-base" style={{ '--card-theme': '255, 138, 29', padding: 'var(--space-4)' } as React.CSSProperties}>
          <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '16px', height: '16px', stroke: 'var(--color-orange)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              </svg>
              <span className="kpi-title">Solar Project Parameters</span>
            </div>
          </div>

          <form
            className="calc-form"
            id="tabCalcForm"
            onSubmit={(e) => { e.preventDefault(); handleCalculate() }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabMonthlyBill" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Current Monthly Electricity Bill (₹)
              </label>
              <div className="calc-input-wrapper" style={{ position: 'relative' }}>
                <span className="calc-input-prefix" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  ₹
                </span>
                <input
                  type="number"
                  id="tabMonthlyBill"
                  value={formData.monthlyBill}
                  onChange={handleMonthlyBillChange}
                  min="500"
                  max="100000"
                  required
                  style={{ width: '100%', padding: '9px 10px 9px 26px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabSunHours" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Average Daily Sunlight (Hours)
              </label>
              <div className="calc-input-wrapper" style={{ position: 'relative' }}>
                <span className="calc-input-prefix" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--color-orange)' }}>
                  ☼
                </span>
                <input
                  type="number"
                  id="tabSunHours"
                  value={formData.sunHours}
                  onChange={handleSunHoursChange}
                  min="1"
                  max="12"
                  step="0.5"
                  required
                  style={{ width: '100%', padding: '9px 10px 9px 26px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabSystemSize" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target System Capacity (kW)
              </label>
              <div className="calc-input-wrapper" style={{ position: 'relative' }}>
                <span className="calc-input-prefix" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--color-cyan)' }}>
                  ⚡
                </span>
                <input
                  type="number"
                  id="tabSystemSize"
                  value={formData.systemSize}
                  onChange={handleSystemSizeChange}
                  min="1"
                  max="50"
                  step="0.5"
                  required
                  style={{ width: '100%', padding: '9px 10px 9px 26px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabPanelQuality" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Solar Panel Technology Tier
              </label>
              <div className="calc-input-wrapper">
                <select
                  id="tabPanelQuality"
                  value={formData.panelQuality}
                  onChange={handlePanelQualityChange}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="mono">Mono PERC (High efficiency 21.4%)</option>
                  <option value="poly">Polycrystalline (Standard 17.2%)</option>
                  <option value="bifacial">Bifacial Dual-glass (23.1%)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                id="tabComputeSavingsBtn"
                disabled={isLoading}
                style={{ flex: 1, padding: '9px 16px', fontSize: '12px' }}
              >
                {isLoading ? 'Computing Returns...' : 'Calculate Financial ROI'}
              </button>
              {hasCalculated && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleReset}
                  style={{ padding: '9px 14px', fontSize: '12px' }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: KPI Cards & Results Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {isLoading && <LoadingSpinner />}

          {!isLoading && <ROIResultsGrid result={result} />}

          {error && (
            <div
              id="roiAnalysisErrorBox"
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-red)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                {error}
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCalculate}
              >
                Retry Calculation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Detailed Financial Specs (Post-Calculation) ── */}
      {hasCalculated && (
        <div id="roiAnalysisResults" style={{ marginTop: 'var(--space-2)' }}>
          <ROIDetailedSpecs result={result} />
        </div>
      )}

      {/* ── 25-Year Cumulative Returns Chart ── */}
      <ROIChart
        chartData={chartData}
        paybackPeriod={result.paybackPeriod}
        netCost={result.netCost}
        annualSavings={result.annualSavings}
      />
    </div>
  )
}
