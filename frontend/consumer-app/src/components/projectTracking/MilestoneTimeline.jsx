import React from 'react';
import { MdCheckCircle, MdSchedule, MdLock } from 'react-icons/md';
import { STAGES } from '../../services/projectTracking.service';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MilestoneTimeline({ milestones, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div className="skeleton skeleton-avatar" style={{ width: '32px', height: '32px' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text medium" />
              <div className="skeleton skeleton-text narrow" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
        <div className="table-empty-icon">🏁</div>
        <div className="table-empty-title">No milestones</div>
        <div className="table-empty-desc">Project milestones will appear as the project progresses through the pipeline.</div>
      </div>
    );
  }

  return (
    <div className="timeline-vertical animate-fade-in">
      {milestones.sort((a, b) => a.order - b.order).map((ms, idx) => {
        const stageInfo = STAGES.find(s => s.id === ms.stageId);
        const IconComponent = ms.status === 'completed' ? MdCheckCircle : ms.status === 'active' ? MdSchedule : MdLock;
        const iconColor = ms.status === 'completed' ? 'var(--color-green)' : ms.status === 'active' ? 'var(--color-blue)' : 'var(--text-muted)';

        return (
          <div
            key={ms.stageId}
            className={`timeline-item ${ms.status} animate-slide-up`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ marginTop: '2px', color: iconColor, fontSize: '18px', flexShrink: 0 }}>
                <IconComponent />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                    {ms.label}
                  </span>
                  <span style={{ fontSize: '14px' }}>{stageInfo?.icon}</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {ms.completedAt ? `Completed ${formatDate(ms.completedAt)}` : ms.enteredAt ? `Entered ${formatDate(ms.enteredAt)}` : 'Not yet started'}
                </div>
                {ms.status === 'active' && (
                  <span className="badge badge-sm badge-info" style={{ marginTop: 'var(--space-1)' }}>
                    In Progress
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: iconColor, fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>
                {ms.status === 'completed' ? 'Done' : ms.status === 'active' ? 'Active' : 'Pending'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
