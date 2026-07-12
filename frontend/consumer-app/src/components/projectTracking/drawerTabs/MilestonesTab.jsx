import React from 'react';
import { STAGES } from '../../../services/projectTracking.service';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MilestonesTab({ project }) {
  const milestones = project.milestones || [];

  if (milestones.length === 0) {
    return (
      <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
        <div className="table-empty-icon">🏁</div>
        <div className="table-empty-title">No milestones defined</div>
        <div className="table-empty-desc">Project milestones will appear once the project progresses.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 'var(--space-3)', alignItems: 'center' }}>
        {milestones.sort((a, b) => a.order - b.order).map((ms, idx) => {
          const stageInfo = STAGES.find(s => s.id === ms.stageId);
          return (
            <React.Fragment key={ms.stageId}>
              <div style={{
                width: '24px', height: '24px', borderRadius: 'var(--radius-full)',
                background: ms.status === 'completed' ? 'var(--color-green)' : ms.status === 'active' ? 'var(--color-blue)' : 'var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: 'white', justifySelf: 'center'
              }}>
                {ms.status === 'completed' ? '✓' : ms.status === 'active' ? '●' : '○'}
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  {ms.label}
                </div>
                {ms.enteredAt && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatDate(ms.enteredAt)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: ms.status === 'completed' ? 'var(--color-green)' : ms.status === 'active' ? 'var(--color-blue)' : 'var(--text-muted)', fontWeight: 'var(--font-weight-semibold)' }}>
                {ms.status === 'completed' ? 'Completed' : ms.status === 'active' ? 'In Progress' : 'Pending'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {stageInfo?.icon}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
