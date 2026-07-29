import React from 'react'
import { MdCheckCircle, MdError, MdBuild, MdLightbulb, MdCalendarToday } from 'react-icons/md'
import type { AMCRecommendationResult as AMCRecommendationDataType } from '../types/amc.types'

interface AMCRecommendationResultProps {
  result: AMCRecommendationDataType | null
  loading: boolean
  onDownload?: () => void
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `\u20B9${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `\u20B9${(val / 1000).toFixed(0)}K`
  return `\u20B9${val}`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Healthy': return 'var(--accent-green)'
    case 'Needs Attention': return 'var(--accent-orange)'
    case 'Critical': return 'var(--accent-red)'
    default: return 'var(--text-muted)'
  }
}

function AMCRecommendationResultComponent({ result, loading, onDownload }: AMCRecommendationResultProps) {
  if (loading) {
    return (
      <div className="card-base" style={{ '--card-theme': '139, 92, 246' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <div className="skeleton skeleton-text narrow" style={{ width: '200px' }} />
        </div>
        <div style={{ marginTop: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '8px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!result) return null

  const statusColor = getStatusColor(result.systemStatus)
  const plan = result.systemStatus === 'Healthy' ? 'Premium Annual' : 'Standard Quarterly'
  const period = result.urgentActionRequired ? 'Immediate Remedial Action' : 'Quarterly Maintenance (4 visits/yr)'

  return (
    <div className="card-base" style={{ '--card-theme': '139, 92, 246' } as React.CSSProperties}>
      {/* Header with Customer Name, Status Badge, Download */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color-light)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-navy)' }}>
            {result.customerName}'s Solar System
          </h3>
          <span
            style={{
              fontSize: '11px', fontWeight: 700,
              background: `${statusColor}20`, color: statusColor,
              padding: '3px 8px', borderRadius: '12px',
            }}
          >
            {(result.systemStatus || 'Needs Attention').toUpperCase()}
          </span>
        </div>
        {onDownload && (
          <button className="calc-btn" onClick={onDownload} style={{ marginTop: 0, width: 'auto', backgroundColor: 'var(--accent-blue)' }}>
            Download AMC Report
          </button>
        )}
      </div>

      {/* Diagnosis Summary */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Diagnosis Summary
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-navy)', lineHeight: 1.5 }}>
          {result.diagnosisSummary}
        </p>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid var(--border-color-light)', borderBottom: '1px solid var(--border-color-light)', padding: '15px 0', marginTop: '15px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Recommended Plan</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-navy)' }}>{plan}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Annual Pricing</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-navy)' }}>{`\u20B9${Number(result.estimatedServiceCostRs).toLocaleString('en-IN')} / Yr`}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Service Frequency</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-navy)' }}>{period}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Next Service Due</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-navy)' }}>
            {result.nextServiceDue ? new Date(result.nextServiceDue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </strong>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '15px' }}>
        <div className="card-metric accent-purple" style={{ padding: '12px' }}>
          <span className="card-metric-label">Health Score</span>
          <div className="card-metric-value" style={{ fontSize: 'var(--font-size-xl)', color: statusColor }}>
            {result.healthScore}/100
          </div>
        </div>
        <div className="card-metric accent-orange" style={{ padding: '12px' }}>
          <span className="card-metric-label">Generation Drop</span>
          <div className="card-metric-value" style={{ fontSize: 'var(--font-size-xl)' }}>
            {result.generationDropPct}%
          </div>
        </div>
        <div className="card-metric accent-green" style={{ padding: '12px' }}>
          <span className="card-metric-label">Monthly Loss</span>
          <div className="card-metric-value" style={{ fontSize: 'var(--font-size-xl)' }}>
            {formatCurrency(result.monthlyLossRs)}
          </div>
        </div>
        <div className="card-metric accent-blue" style={{ padding: '12px' }}>
          <span className="card-metric-label">Est. Service Cost</span>
          <div className="card-metric-value" style={{ fontSize: 'var(--font-size-xl)' }}>
            {formatCurrency(result.estimatedServiceCostRs)}
          </div>
        </div>
      </div>

      {/* Next Service + Urgent */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <MdCalendarToday /> Next Service Due: <strong style={{ color: 'var(--text-navy)' }}>{result.nextServiceDue ? new Date(result.nextServiceDue).toLocaleDateString('en-IN') : 'N/A'}</strong>
        </div>
        {result.urgentActionRequired && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--accent-red)' }}>
            <MdError /> Urgent Action Required
          </div>
        )}
      </div>

      {/* Fault Analysis */}
      {result.faultAnalysis.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdError /> Fault Analysis
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.faultAnalysis.map((fault, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px', color: 'var(--text-navy)' }}>
                <span style={{ color: 'var(--accent-red)', flexShrink: 0 }}>{'\u2022'}</span>
                {fault}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {result.recommendedActions.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdBuild /> Recommended Actions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.recommendedActions.map((action, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px', color: 'var(--text-navy)' }}>
                <MdCheckCircle size={12} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '2px' }} />
                {action}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preventive Measures */}
      {result.preventiveMeasures.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdLightbulb /> Preventive Measures
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.preventiveMeasures.map((measure, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px', color: 'var(--text-navy)' }}>
                <MdCheckCircle size={12} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '2px' }} />
                {measure}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const AMCRecommendationResult = React.memo(AMCRecommendationResultComponent)
