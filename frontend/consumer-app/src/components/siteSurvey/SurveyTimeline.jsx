import React from 'react';

const STEPS = [
  { key: 'scheduled', label: 'Scheduled', icon: 'icon-calendar', color: 'var(--color-blue)' },
  { key: 'assigned', label: 'Assigned', icon: 'icon-users', color: 'var(--color-purple)' },
  { key: 'traveling', label: 'Traveling', icon: 'icon-route', color: 'var(--color-orange)' },
  { key: 'on_site', label: 'On Site', icon: 'icon-mappin', color: 'var(--color-orange)' },
  { key: 'uploading', label: 'Photos', icon: 'icon-camera', color: 'var(--color-blue)' },
  { key: 'ai_analysis', label: 'AI Analysis', icon: 'icon-sparkles', color: 'var(--color-purple)' },
  { key: 'review', label: 'Review', icon: 'icon-clipboard-check', color: 'var(--color-orange)' },
  { key: 'approved', label: 'Approved', icon: 'icon-shield', color: 'var(--color-green)' },
  { key: 'proposal_ready', label: 'Proposal Ready', icon: 'icon-reports', color: 'var(--color-green)' },
];

const STATUS_ORDER = STEPS.map(s => s.key);

function getStepState(stepKey, currentStatus) {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (currentIdx === -1) return 'pending';
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export default function SurveyTimeline({ status }) {
  const currentStatus = status || 'scheduled';

  return (
    <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-5)' }}>
        Workflow Timeline
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, idx) => {
          const state = getStepState(step.key, currentStatus);
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.key} style={{ display: 'flex', gap: 'var(--space-3)', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: state === 'completed' ? step.color
                    : state === 'active' ? step.color
                    : 'var(--bg-tertiary)',
                  border: state === 'active' ? `2px solid ${step.color}` : 'none',
                  transition: 'all 0.4s ease',
                  flexShrink: 0,
                  boxShadow: state === 'active' ? `0 0 0 4px ${step.color}20` : 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={state === 'pending' ? 'var(--text-muted)' : 'white'}
                    strokeWidth={state === 'completed' ? 3 : 2}
                    strokeLinecap="round" strokeLinejoin="round">
                    {state === 'completed' ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <use href={`#${step.icon}`} />
                    )}
                  </svg>
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 20,
                    background: state === 'completed' ? step.color : 'var(--bg-tertiary)',
                    transition: 'background 0.4s ease',
                  }} />
                )}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : 'var(--space-4)', paddingTop: 4 }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)', fontWeight: state === 'active' ? 700 : 500,
                  color: state === 'completed' ? step.color
                    : state === 'active' ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  transition: 'all 0.3s ease',
                }}>
                  {step.label}
                </div>
                {state === 'active' && (
                  <div style={{
                    fontSize: 'var(--font-size-xs)', fontWeight: 600,
                    color: step.color, marginTop: 2,
                    display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: 'var(--radius-full)',
                      background: step.color, display: 'inline-block',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    Current step
                  </div>
                )}
                {state === 'completed' && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-green)', marginTop: 2 }}>
                    Complete
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}