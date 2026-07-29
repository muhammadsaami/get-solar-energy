import React, { useState } from 'react';

const STATUS_COLORS = {
  scheduled: { bg: 'var(--color-blue-surface)', text: 'var(--color-blue)', label: 'Scheduled' },
  assigned: { bg: 'var(--color-purple-surface)', text: 'var(--color-purple)', label: 'Assigned' },
  traveling: { bg: 'var(--color-orange-surface)', text: 'var(--color-orange)', label: 'Traveling' },
  on_site: { bg: 'var(--color-orange-surface)', text: 'var(--color-orange)', label: 'On Site' },
  uploading: { bg: 'var(--color-blue-surface)', text: 'var(--color-blue)', label: 'Uploading' },
  ai_analysis: { bg: 'var(--color-purple-surface)', text: 'var(--color-purple)', label: 'AI Analysis' },
  review: { bg: 'var(--color-orange-surface)', text: 'var(--color-orange)', label: 'Review' },
  approved: { bg: 'var(--color-green-surface)', text: 'var(--color-green)', label: 'Approved' },
  proposal_ready: { bg: 'var(--color-green-surface)', text: 'var(--color-green)', label: 'Proposal Ready' },
  cancelled: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', label: 'Cancelled' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.scheduled;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--font-size-xs)', fontWeight: 600, background: cfg.bg, color: cfg.text,
    }}>
      {cfg.label}
    </span>
  );
}

function getProgressColor(pct) {
  if (pct >= 80) return 'var(--color-green)';
  if (pct >= 40) return 'var(--color-orange)';
  return 'var(--color-blue)';
}

function PremiumEmptyState({ onCreate }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-16) var(--space-8)', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <use href="#icon-clipboard" />
        </svg>
      </div>
      <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>
        No Site Surveys Yet
      </h3>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-6)', maxWidth: 440, lineHeight: 1.6 }}>
        Schedule your first field inspection to begin the installation workflow for your customers.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button className="btn btn-primary btn-sm" onClick={onCreate} aria-label="Schedule Survey">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Schedule Survey
        </button>
        <button className="btn btn-outline btn-sm" aria-label="Import existing survey" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Import Existing
        </button>
      </div>
    </div>
  );
}

export default function SurveyList({ surveys, onSelect, onCreate }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEngineer, setFilterEngineer] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  if (!surveys || surveys.length === 0) {
    return <PremiumEmptyState onCreate={onCreate} />;
  }

  const engineers = [...new Set(surveys.map(s => s.assigned_name).filter(Boolean))];

  const sorted = [...surveys].sort((a, b) => (a.id || 0) - (b.id || 0));

  return (
    <div>
      <div style={{
        display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)',
        padding: 'var(--space-4)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="form-input"
            type="text"
            placeholder="Search by customer, city, engineer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) 36px', fontSize: 'var(--font-size-sm)' }}
            aria-label="Search surveys"
          />
        </div>
        <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: 140, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} aria-label="Filter by status">
          <option value="">All Status</option>
          {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select className="form-input" value={filterEngineer} onChange={(e) => setFilterEngineer(e.target.value)}
          style={{ width: 150, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} aria-label="Filter by engineer">
          <option value="">All Engineers</option>
          {engineers.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="form-input" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ width: 130, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} aria-label="Filter by priority">
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        {(search || filterStatus || filterEngineer || filterPriority) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterEngineer(''); setFilterPriority(''); }}
            style={{ color: 'var(--color-orange)' }} aria-label="Clear filters">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {sorted
          .filter(s => !filterStatus || s.status === filterStatus)
          .filter(s => !filterEngineer || s.assigned_name === filterEngineer)
          .filter(s => !filterPriority || s.priority === filterPriority)
          .filter(s => !search || s.customer_name?.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase()) || s.assigned_name?.toLowerCase().includes(search.toLowerCase()))
          .map((survey) => {
            const progressColor = getProgressColor(survey.completion_percentage || 0);
            return (
              <div
                key={survey.id}
                className="card-glass"
                style={{
                  padding: 'var(--space-4) var(--space-5)', cursor: 'pointer',
                  display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 100px 140px',
                  gap: 'var(--space-4)', alignItems: 'center',
                  transition: 'all var(--transition-normal)',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-active)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none' }}
                onClick={() => onSelect(survey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(survey); }}
                aria-label={`Open survey for ${survey.customer_name}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <use href="#icon-clipboard" />
                    </svg>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {survey.customer_name}
                    </span>
                    {survey.priority === 'high' && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: 'var(--color-red)', padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(244,63,94,0.1)',
                      }}>
                        High
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {survey.city || 'Location N/A'} &middot; {survey.roof_type || 'Roof N/A'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <use href="#icon-users" />
                  </svg>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    {survey.assigned_name || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <StatusBadge status={survey.status} />
                </div>

                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {survey.scheduled_date || 'TBD'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${survey.completion_percentage || 0}%`, height: '100%',
                        background: progressColor, borderRadius: 2,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: progressColor, minWidth: 36, textAlign: 'right' }}>
                      {survey.completion_percentage || 0}%
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {survey.status === 'approved' || survey.status === 'proposal_ready' ? 'Complete' : survey.status === 'cancelled' ? 'Stopped' : 'Active'}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}