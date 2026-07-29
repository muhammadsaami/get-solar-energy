import type { ROIResult } from '../../hooks/roiCalculator.types'

interface ROIResultsGridProps {
  result: ROIResult
}

function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function formatLakhs(value: number): string {
  return `₹${(value / 100000).toFixed(1)} Lakhs`
}

function formatPayback(value: number): string {
  return `${value.toFixed(1)} Years`
}

export default function ROIResultsGrid({ result }: ROIResultsGridProps) {
  return (
    <>
      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title" style={{ fontSize: '11px' }}>System Cost</span>
            <svg className="kpi-title-icon blue" style={{ width: '16px', height: '16px' }}><use href="#icon-bill"></use></svg>
          </div>
          <div className="kpi-value-block" style={{ margin: '4px 0 2px 0' }}>
            <span className="kpi-value-text" style={{ fontSize: '20px' }}>{formatCurrency(result.systemCost)}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Total solar installation setup cost</span>
        </div>
        <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title" style={{ fontSize: '11px' }}>Government Subsidy</span>
            <svg className="kpi-title-icon green" style={{ width: '16px', height: '16px' }}><use href="#icon-gift"></use></svg>
          </div>
          <div className="kpi-value-block" style={{ margin: '4px 0 2px 0' }}>
            <span className="kpi-value-text" style={{ fontSize: '20px' }}>-{formatCurrency(result.governmentSubsidy)}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>PM-Surya Ghar central subsidy</span>
        </div>
        <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title" style={{ fontSize: '11px' }}>Net Investment</span>
            <svg className="kpi-title-icon blue" style={{ width: '16px', height: '16px' }}><use href="#icon-lifetime-savings"></use></svg>
          </div>
          <div className="kpi-value-block" style={{ margin: '4px 0 2px 0' }}>
            <span className="kpi-value-text" style={{ fontSize: '20px' }}>{formatCurrency(result.netCost)}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Actual out-of-pocket project cost</span>
        </div>
        <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title" style={{ fontSize: '11px' }}>Payback Period</span>
            <svg className="kpi-title-icon orange" style={{ width: '16px', height: '16px' }}><use href="#icon-system-performance"></use></svg>
          </div>
          <div className="kpi-value-block" style={{ margin: '4px 0 2px 0' }}>
            <span className="kpi-value-text" style={{ fontSize: '20px', color: 'var(--accent-orange)' }}>{formatPayback(result.paybackPeriod)}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Estimated time to break even</span>
        </div>
      </div>

      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
        <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title" style={{ fontSize: '11px' }}>Annual Savings</span>
            <svg className="kpi-title-icon green" style={{ width: '16px', height: '16px' }}><use href="#icon-annual-savings"></use></svg>
          </div>
          <div className="kpi-value-block" style={{ margin: '4px 0 2px 0' }}>
            <span className="kpi-value-text" style={{ fontSize: '20px' }}>{formatCurrency(result.annualSavings)}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Recurring yearly electricity bill savings</span>
        </div>
        <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
          <div className="kpi-header-row">
            <span className="kpi-title" style={{ fontSize: '11px' }}>Lifetime Savings</span>
            <svg className="kpi-title-icon blue" style={{ width: '16px', height: '16px' }}><use href="#icon-lifetime-savings"></use></svg>
          </div>
          <div className="kpi-value-block" style={{ margin: '4px 0 2px 0' }}>
            <span className="kpi-value-text" style={{ fontSize: '20px' }}>{formatLakhs(result.lifetimeSavings)}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Cumulative savings over 25 years</span>
        </div>
      </div>
    </>
  )
}
