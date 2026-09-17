import React from 'react';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60));
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const TYPE_COLORS = {
  proposal: 'var(--color-blue)', survey: 'var(--color-purple)',
  installation: 'var(--color-orange)', engineer: 'var(--color-cyan)',
  inspection: 'var(--color-green)', invoice: 'var(--color-yellow)', amc: 'var(--color-purple)'
};

export default function ActivityTab({ project, activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
        <div className="table-empty-icon">📭</div>
        <div className="table-empty-title">No recent activity</div>
        <div className="table-empty-desc">Project activity will appear here as changes are made.</div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {activities.map((act) => (
        <div key={act.id} className="activity-item">
          <div style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
            background: `${TYPE_COLORS[act.type] || 'var(--color-blue)'}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0
          }}>
            {act.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              {act.title}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
              {act.description}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{act.user}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTimeAgo(act.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
