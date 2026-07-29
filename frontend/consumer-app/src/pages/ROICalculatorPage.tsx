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
          borderTopColor: 'var(--accent-orange)',
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
    <>
      <div className="tab-header-block">
        <h2 className="tab-heading">Financial Savings & ROI Simulator</h2>
        <p className="tab-subheading">
          Simulate your payback period, investment metrics, and cumulative returns based on government subsidy guidelines.
        </p>
      </div>

      <div
        className="tab-grid-layout"
        style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', marginBottom: '20px' }}
      >
        {/* LEFT COLUMN: Form */}
        <div className="card-base" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title">Solar Project Details</span>
          </div>
          <form
            className="calc-form"
            id="tabCalcForm"
            onSubmit={(e) => { e.preventDefault(); handleCalculate() }}
            style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabMonthlyBill" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Current Monthly Bill (₹)
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
                  style={{ width: '100%', padding: '10px 10px 10px 25px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-navy)' }}
                />
              </div>
            </div>

            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabSunHours" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Daily Sun Hours
              </label>
              <div className="calc-input-wrapper" style={{ position: 'relative' }}>
                <span className="calc-input-prefix" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                  style={{ width: '100%', padding: '10px 10px 10px 25px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-navy)' }}
                />
              </div>
            </div>

            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabSystemSize" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                System Size (kW)
              </label>
              <div className="calc-input-wrapper" style={{ position: 'relative' }}>
                <span className="calc-input-prefix" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                  style={{ width: '100%', padding: '10px 10px 10px 25px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-navy)' }}
                />
              </div>
            </div>

            <div className="calc-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="calc-label" htmlFor="tabPanelQuality" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Panel Technology
              </label>
              <div className="calc-input-wrapper">
                <select
                  id="tabPanelQuality"
                  value={formData.panelQuality}
                  onChange={handlePanelQualityChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-navy)' }}
                >
                  <option value="mono">Mono PERC (High efficiency)</option>
                  <option value="poly">Polycrystalline (Standard)</option>
                  <option value="bifacial">Bifacial (Double-sided)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="submit"
                className="calc-btn"
                id="tabComputeSavingsBtn"
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                {isLoading ? 'Calculating...' : 'Run Analysis'}
              </button>
              {hasCalculated && (
                <button
                  type="button"
                  className="calc-btn"
                  onClick={handleReset}
                  style={{ width: 'auto', padding: '10px 16px', background: 'transparent', border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)' }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: KPI cards — always visible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isLoading && <LoadingSpinner />}

          {!isLoading && <ROIResultsGrid result={result} />}

          {error && (
            <div
              id="roiAnalysisErrorBox"
              style={{
                marginTop: '15px',
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(231, 76, 60, 0.05)',
                border: '1px dashed rgba(231, 76, 60, 0.25)',
                textAlign: 'center',
                marginBottom: '15px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                {error}
              </span>
              <button
                type="button"
                className="calc-btn"
                onClick={handleCalculate}
                style={{ margin: '0 auto', width: 'auto', padding: '6px 16px', fontSize: '11px', height: 'auto', borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)', background: 'transparent' }}
              >
                Retry Calculation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analysis Results — only after calculation */}
      {hasCalculated && (
        <div id="roiAnalysisResults" style={{ marginTop: '15px', marginBottom: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
          <ROIDetailedSpecs result={result} />
        </div>
      )}

      {/* Chart — always visible with default data before calculation */}
      <ROIChart
        chartData={chartData}
        paybackPeriod={result.paybackPeriod}
        netCost={result.netCost}
        annualSavings={result.annualSavings}
      />
    </>
  )
}
