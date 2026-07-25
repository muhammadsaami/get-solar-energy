import type { ROIResult } from '../../hooks/roiCalculator.types'

interface ROIDetailedSpecsProps {
  result: ROIResult
}

function fmtCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function fmtPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function fmtPayback(value: number): string {
  return `${value.toFixed(1)} Years`
}

function fmtNumber(value: number): string {
  return value.toLocaleString('en-IN')
}

export default function ROIDetailedSpecs({ result }: ROIDetailedSpecsProps) {
  return (
    <>
      <div
        className="card-base"
        style={{
          '--card-theme': '255, 138, 29',
          marginBottom: '15px',
          padding: '12px 14px',
          background: 'rgba(255, 138, 29, 0.04)',
          border: '1px solid rgba(255, 138, 29, 0.25)',
        } as React.CSSProperties}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 138, 29, 0.15)',
            paddingBottom: '6px',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'var(--accent-orange)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Investment Summary
          </span>
          <span
            style={{
              fontSize: '9px',
              background: 'var(--accent-orange)',
              color: '#fff',
              padding: '1px 5px',
              borderRadius: '3px',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Completed
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Return on Investment
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-green)', display: 'block', marginTop: '2px' }}>
              {fmtPercent(result.roiPercentage)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Payback Period
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-orange)', display: 'block', marginTop: '2px' }}>
              {fmtPayback(result.paybackPeriod)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Net Investment
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }}>
              {fmtCurrency(result.netCost)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Lifetime Savings
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }}>
              {fmtCurrency(result.lifetimeSavings)}
            </span>
          </div>
        </div>
      </div>

      <h3
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-navy)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-orange)', fill: 'none', strokeWidth: '2' }}>
          <polyline points="22 11.08 20 11.08 17 22 12 1 7 22 4 11.08 2 11.08"></polyline>
        </svg>
        Full Financial Breakdown
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <SpecItem label="Recommended Size" value={`${result.recommendedKw} kW`} />
        <SpecItem label="System Cost" value={fmtCurrency(result.systemCost)} />
        <SpecItem label="Subsidy Amount" value={fmtCurrency(result.governmentSubsidy)} />
        <SpecItem label="Net Cost" value={fmtCurrency(result.netCost)} />
        <SpecItem label="Annual Generation" value={`${fmtNumber(result.annualGeneration)} kWh`} />
        <SpecItem label="Monthly Savings" value={fmtCurrency(result.monthlySavings)} />
        <SpecItem label="Annual Savings" value={fmtCurrency(result.annualSavings)} />
        <SpecItem label="Lifetime Savings" value={fmtCurrency(result.lifetimeSavings)} />
        <SpecItem label="Return on Investment" value={fmtPercent(result.roiPercentage)} color="green" />
        <SpecItem label="CO₂ Reduction" value={`${result.co2Reduction.toFixed(2)} Tons`} color="green" />
        <SpecItem label="Payback Period" value={fmtPayback(result.paybackPeriod)} color="orange" span={2} />
      </div>
    </>
  )
}

function SpecItem({
  label,
  value,
  color,
  span,
}: {
  label: string
  value: string
  color?: 'green' | 'orange'
  span?: number
}) {
  const valColor = color === 'green'
    ? 'var(--accent-green)'
    : color === 'orange'
      ? 'var(--accent-orange)'
      : 'var(--text-navy)'

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        padding: '6px 10px',
        borderRadius: '4px',
        gridColumn: span === 2 ? 'span 2' : undefined,
      } as React.CSSProperties}
    >
      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 800, color: valColor }}>
        {value}
      </span>
    </div>
  )
}
