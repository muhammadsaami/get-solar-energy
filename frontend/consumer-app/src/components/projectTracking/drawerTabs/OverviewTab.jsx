import React from 'react';
import { MdCalendarToday, MdLocationOn, MdFlashOn } from 'react-icons/md';
import { STAGES } from '../../../services/projectTracking.service';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function OverviewTab({ project }) {
  const stageInfo = STAGES.find(s => s.id === project.currentStage);
  const totalCost = project.materialsCost + project.laborCost + project.miscCost;
  const profitMargin = project.totalBudget > 0 ? ((project.revenue.actual - totalCost) / project.revenue.actual * 100).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="health-score-ring lg" style={{ background: `${project.health.color}15`, color: project.health.color, border: `3px solid ${project.health.color}` }}>
            {project.health.score}
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {project.health.label}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Health Score · {project.completionPercent}% complete
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="card-stat">
          <div className="card-stat-label"><MdCalendarToday style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Start Date</div>
          <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>{formatDate(project.startDate)}</div>
        </div>
        <div className="card-stat">
          <div className="card-stat-label"><MdCalendarToday style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Deadline</div>
          <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>{formatDate(project.deadline)}</div>
        </div>
        <div className="card-stat">
          <div className="card-stat-label"><MdFlashOn style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Capacity</div>
          <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>{project.capacityKw} kW</div>
        </div>
        <div className="card-stat">
          <div className="card-stat-label"><MdLocationOn style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Location</div>
          <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>{project.city}, {project.state}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)' }}>Type:</span>
        <span className="badge badge-neutral">{project.systemType}</span>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)' }}>Priority:</span>
        <span className={`badge badge-sm ${project.priority === 'critical' ? 'badge-error' : project.priority === 'high' ? 'badge-orange' : project.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
          {project.priority}
        </span>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)' }}>Lead Source:</span>
        <span className="badge badge-info">{project.leadSource}</span>
      </div>

      <div>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          Completion Progress
        </div>
        <div className="progress-header">
          <span className="progress-label">{project.completionPercent}%</span>
          <span className="progress-value">{stageInfo?.label}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill animated" style={{ width: `${project.completionPercent}%` }} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          Financial Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
          <div className="card-stat">
            <div className="card-stat-label">Budget</div>
            <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>₹{(project.totalBudget / 1000).toFixed(0)}K</div>
          </div>
          <div className="card-stat">
            <div className="card-stat-label">Revenue</div>
            <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>₹{(project.revenue.actual / 1000).toFixed(0)}K</div>
          </div>
          <div className="card-stat">
            <div className="card-stat-label">Cost</div>
            <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>₹{(totalCost / 1000).toFixed(0)}K</div>
          </div>
          <div className="card-stat">
            <div className="card-stat-label">Margin</div>
            <div className="card-stat-num" style={{ fontSize: 'var(--font-size-md)' }}>{profitMargin}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
