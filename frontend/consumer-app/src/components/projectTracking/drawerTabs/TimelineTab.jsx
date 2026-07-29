import React from 'react';


const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function TimelineTab({ project }) {
  const timelineEvents = [
    { label: 'Lead Created', date: project.createdAt, icon: '📋', completed: true },
    { label: 'Site Survey', date: project.stageHistory.find(h => h.stage === 'site-survey')?.enteredAt, icon: '🔍', completed: true },
    { label: 'Proposal Sent', date: project.stageHistory.find(h => h.stage === 'proposal-sent')?.enteredAt, icon: '📄', completed: true },
    { label: 'Proposal Approved', date: project.stageHistory.find(h => h.stage === 'approved')?.enteredAt, icon: '✅', completed: true },
    { label: 'Installation', date: project.stageHistory.find(h => h.stage === 'installation')?.enteredAt, icon: '🔧', completed: true },
    { label: 'Inspection', date: project.stageHistory.find(h => h.stage === 'inspection')?.enteredAt, icon: '🔎', completed: true },
    { label: 'Completed', date: project.stageHistory.find(h => h.stage === 'completed')?.enteredAt || project.actualEndDate, icon: '🏆', completed: project.currentStage === 'completed' || project.currentStage === 'amc' },
    { label: 'AMC Active', date: project.stageHistory.find(h => h.stage === 'amc')?.enteredAt, icon: '🛡️', completed: project.currentStage === 'amc' }
  ];

  const now = new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>Project Duration</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Started {formatDate(project.startDate)} · {project.actualEndDate ? `Completed ${formatDate(project.actualEndDate)}` : `Due ${formatDate(project.deadline)}`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {Math.floor((now - new Date(project.startDate)) / (1000 * 60 * 60 * 24))} days
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>elapsed</div>
          </div>
        </div>
      </div>

      <div className="timeline-vertical">
        {timelineEvents.map((event, idx) => {
          const isActive = !event.completed && timelineEvents.slice(0, idx).every(e => e.completed);
          return (
            <div key={idx} className={`timeline-item ${event.completed ? 'completed' : isActive ? 'active' : 'pending'}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '16px', marginTop: '2px' }}>{event.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                    {event.label}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {event.date ? formatDate(event.date) : 'Pending'}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: event.completed ? 'var(--color-green)' : isActive ? 'var(--color-blue)' : 'var(--text-muted)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {event.completed ? 'Done' : isActive ? 'In Progress' : 'Pending'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
