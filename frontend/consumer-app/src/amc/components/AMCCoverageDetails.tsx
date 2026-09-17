import React from 'react'
import { MdCheckCircle, MdClose } from 'react-icons/md'
import type { AMCContract } from '../types/amc.types'

interface AMCCoverageDetailsProps {
  contract: AMCContract | null
  loading: boolean
}

function AMCCoverageDetailsComponent({ contract, loading }: AMCCoverageDetailsProps) {
  if (loading) {
    return (
      <div className="card-base" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <div className="skeleton skeleton-text narrow" style={{ width: '140px' }} />
        </div>
        <div style={{ marginTop: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '6px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="card-base" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Coverage</span>
        </div>
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          No contract selected.
        </div>
      </div>
    )
  }

  return (
    <div className="card-base" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <span className="kpi-title">Coverage Details</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {contract.planType} Plan
        </span>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '4px' }}>
          Covered
        </div>
        {contract.coverageDetails.length === 0 ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No coverage details listed.</div>
        ) : (
          contract.coverageDetails.map((detail, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-navy)' }}>
              <MdCheckCircle size={14} color="var(--accent-green)" />
              {detail}
            </div>
          ))
        )}
        {contract.exclusions.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-red)', marginTop: '8px', marginBottom: '4px' }}>
              Exclusions
            </div>
            {contract.exclusions.map((exclusion, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <MdClose size={14} />
                {exclusion}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export const AMCCoverageDetails = React.memo(AMCCoverageDetailsComponent)
