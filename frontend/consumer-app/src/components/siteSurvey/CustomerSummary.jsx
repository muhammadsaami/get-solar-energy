import React from 'react';

export default function CustomerSummary({ survey }) {
  if (!survey) return null;

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'white',
        }}>
          {(survey.customer_name || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {survey.customer_name}
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Survey #{survey.id}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
          padding: '4px 12px', borderRadius: 'var(--radius-full)',
          background: survey.status === 'approved' || survey.status === 'proposal_ready' ? 'var(--color-green-surface)' :
            survey.status === 'cancelled' ? 'rgba(244,63,94,0.1)' : 'var(--color-blue-surface)',
          color: survey.status === 'approved' || survey.status === 'proposal_ready' ? 'var(--color-green)' :
            survey.status === 'cancelled' ? '#f43f5e' : 'var(--color-blue)',
          fontSize: 'var(--font-size-xs)', fontWeight: 600,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <use href="#icon-activity" />
          </svg>
          {survey.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Draft'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        {[
          { label: 'Phone', value: survey.phone || 'N/A', icon: 'icon-chat' },
          { label: 'City', value: survey.city || 'N/A', icon: 'icon-mappin' },
          { label: 'Address', value: survey.address || survey.city || 'N/A', icon: 'icon-home' },
          { label: 'Roof Type', value: survey.roof_type || 'N/A', icon: 'icon-roof' },
          { label: 'Assigned Engineer', value: survey.assigned_name || 'Unassigned', icon: 'icon-users' },
          { label: 'Scheduled', value: survey.scheduled_date || 'TBD', icon: 'icon-calendar' },
          { label: 'Journey Stage', value: 'Site Survey (ST-07)', icon: 'icon-route' },
          { label: 'Proposal Status', value: survey.status === 'proposal_ready' ? 'Ready' : survey.status === 'approved' ? 'Approved' : 'Pending', icon: 'icon-reports' },
        ].map((item) => (
          <div key={item.label} style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${item.icon}`} />
              </svg>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}