import React from 'react';
import { useSiteSurvey } from '../../contexts/SiteSurveyContext';
import { useAuth } from '../../contexts/AuthContext';

const HOUR = new Date().getHours();
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening';
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

function StatBadge({ icon, value, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <use href={`#${icon}`} />
      </svg>
      <div>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-1)', opacity: 0.85 }}>{label}</span>
      </div>
    </div>
  );
}

const KPI_CARDS = [
  { key: 'today_count', label: "Today's Surveys", color: 'var(--color-blue)', suffix: '', icon: 'icon-calendar', accent: 'blue' },
  { key: 'scheduled', label: 'Scheduled', color: 'var(--color-purple)', suffix: '', icon: 'icon-clipboard', accent: 'purple' },
  { key: 'on_site', label: 'In Progress', color: 'var(--color-orange)', suffix: '', icon: 'icon-mappin', accent: 'orange' },
  { key: 'pending_review', label: 'Pending Review', color: 'var(--color-red)', suffix: '', icon: 'icon-clipboard-check', accent: 'red' },
  { key: 'completed_surveys', label: 'Completed', color: 'var(--color-green)', suffix: '', icon: 'icon-shield', accent: 'green' },
  { key: 'cancelled', label: 'High Risk', color: 'var(--color-red)', suffix: '', icon: 'icon-alert-triangle', accent: 'red' },
  { key: 'avg_feasibility_score', label: 'Avg Feasibility', color: 'var(--color-orange)', suffix: '%', icon: 'icon-trending', accent: 'orange' },
  { key: 'completion_rate', label: 'Completion Rate', color: 'var(--color-green)', suffix: '%', icon: 'icon-activity', accent: 'green' },
];

export default function SiteSurveyDashboard({ onNewSurvey, onAction }) {
  const { dashboardStats, loading, fetchDashboard } = useSiteSurvey();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Operator';

  const QUICK_ACTIONS = [
    { id: 'schedule', label: 'Schedule Survey', icon: 'icon-calendar', description: 'Plan a new field inspection.', action: 'schedule' },
    { id: 'start', label: 'Start Survey', icon: 'icon-mappin', description: 'Begin inspection on site.', action: 'start' },
    { id: 'photos', label: 'Upload Photos', icon: 'icon-camera', description: 'Attach site photos to survey.', action: 'photos' },
    { id: 'ai', label: 'AI Analysis', icon: 'icon-sparkles', description: 'Generate feasibility report.', action: 'ai' },
    { id: 'assign', label: 'Assign Engineer', icon: 'icon-users', description: 'Allocate survey to team.', action: 'assign' },
    { id: 'calendar', label: 'View Calendar', icon: 'icon-route', description: 'See all scheduled surveys.', action: 'calendar' },
  ];

  if (loading && !dashboardStats) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }} />
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const s = dashboardStats || {};

  return (
    <>
      <div style={{
        padding: 'var(--space-6) var(--space-8)', borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #0D2136 0%, #06111f 100%)',
        border: '1px solid var(--glass-border)',
        position: 'relative', overflow: 'hidden',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,138,29,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Good {GREETING}, {firstName}
              </h1>
              <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Site Survey Operations &middot; {TODAY}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-primary btn-sm" onClick={onNewSurvey} aria-label="Schedule Survey">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Schedule Survey
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={fetchDashboard}
                aria-label="Refresh dashboard"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)',
            paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)',
          }}>
            <StatBadge icon="icon-calendar" value={s.today_count ?? 0} label="Today's Surveys" color="var(--color-orange)" />
            <StatBadge icon="icon-mappin" value={s.on_site ?? 0} label="In Progress" color="var(--color-blue)" />
            <StatBadge icon="icon-clipboard-check" value={s.pending_review ?? 0} label="Pending Review" color="var(--color-purple)" />
            <StatBadge icon="icon-alert-triangle" value={s.cancelled ?? 0} label="High Risk" color="var(--color-red)" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, margin: '0 0 var(--space-5)', color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => onAction ? onAction(action.action) : onNewSurvey()}
                className="card-feature"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-1)',
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-normal)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-active)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                aria-label={action.label}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-orange-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 'var(--space-1)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <use href={`#${action.icon}`} />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="card-title">Operational KPIs</h3>
          </div>
          <div className="card-grid card-grid-4">
            {KPI_CARDS.map((kpi) => {
              const value = s[kpi.key] ?? 0;
              return (
                <div key={kpi.key} className={`card-metric accent-${kpi.accent}`} style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div className="card-metric-label">{kpi.label}</div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={kpi.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                      <use href={`#${kpi.icon}`} />
                    </svg>
                  </div>
                  <div className="card-metric-value" style={{ color: kpi.color, fontSize: 'var(--font-size-3xl)' }}>
                    {value}{kpi.suffix}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                    Current period
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}