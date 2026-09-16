import React from 'react';

const IMPACT_COLORS = { High: 'badge-error', Medium: 'badge-warning', Low: 'badge-info' };
const PROB_COLORS = { High: 'badge-error', Medium: 'badge-warning', Low: 'badge-neutral' };
const STATUS_COLORS = { open: 'badge-error', mitigated: 'badge-warning', closed: 'badge-success' };

export default function RisksTab({ project }) {
  const risks = project.risks || [];

  if (risks.length === 0) {
    return (
      <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
        <div className="table-empty-icon">✅</div>
        <div className="table-empty-title">No risks identified</div>
        <div className="table-empty-desc">This project has no open risks at this time.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {risks.map((risk) => (
        <div key={risk.id} className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                {risk.description}
              </div>
            </div>
            <span className={`badge badge-sm ${STATUS_COLORS[risk.status] || 'badge-neutral'}`}>
              {risk.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
            <span className={`badge badge-sm ${IMPACT_COLORS[risk.impact] || 'badge-neutral'}`}>
              Impact: {risk.impact}
            </span>
            <span className={`badge badge-sm ${PROB_COLORS[risk.probability] || 'badge-neutral'}`}>
              Probability: {risk.probability}
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>Mitigation: </span>
            {risk.mitigation}
          </div>
        </div>
      ))}
    </div>
  );
}
