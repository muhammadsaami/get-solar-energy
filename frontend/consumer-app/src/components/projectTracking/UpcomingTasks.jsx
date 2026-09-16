import React, { useState } from 'react';
import { MdCheckCircle, MdRadioButtonUnchecked, MdExpandMore, MdExpandLess } from 'react-icons/md';

const CATEGORIES = [
  { key: 'due-today', label: 'Due Today', icon: '🔴' },
  { key: 'this-week', label: 'This Week', icon: '🟡' },
  { key: 'overdue', label: 'Overdue', icon: '🔴' },
  { key: 'completed', label: 'Completed', icon: '✅' }
];

const PRIORITY_CONFIG = {
  critical: { color: 'var(--color-red)', label: 'Critical' },
  high: { color: 'var(--color-orange)', label: 'High' },
  medium: { color: 'var(--color-yellow)', label: 'Medium' },
  low: { color: 'var(--text-muted)', label: 'Low' }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff}d`;
};

export default function UpcomingTasks({ tasks, loading }) {
  const [expanded, setExpanded] = useState({});

  const toggleCategory = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const grouped = {};
  CATEGORIES.forEach(cat => { grouped[cat.key] = []; });
  (tasks || []).forEach(task => {
    if (grouped[task.category]) grouped[task.category].push(task);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {CATEGORIES.map(cat => (
          <div key={cat.key}>
            <div className="skeleton skeleton-text medium" />
            <div className="skeleton skeleton-text wide" />
          </div>
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
        <div className="table-empty-icon">📋</div>
        <div className="table-empty-title">No upcoming tasks</div>
        <div className="table-empty-desc">Tasks assigned to your team will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {CATEGORIES.map(({ key, label, icon }) => {
        const categoryTasks = grouped[key] || [];
        const isExpanded = expanded[key] !== false;

        return (
          <div key={key}>
            <div
              className="task-category-header"
              onClick={() => toggleCategory(key)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategory(key); } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span>{icon}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                  {label}
                </span>
                <span className="badge badge-sm badge-neutral">{categoryTasks.length}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '16px', display: 'flex' }}>
                {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
              </div>
            </div>
            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {categoryTasks.length === 0 ? (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No tasks in this category
                  </div>
                ) : (
                  categoryTasks.map(task => {
                    const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <div key={task.id} className="task-item">
                        <div style={{ color: task.completed ? 'var(--color-green)' : 'var(--text-muted)', fontSize: '18px', display: 'flex', flexShrink: 0 }}>
                          {task.completed ? <MdCheckCircle /> : <MdRadioButtonUnchecked />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-primary)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            opacity: task.completed ? 0.6 : 1,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {task.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                            <span className={`badge badge-sm`} style={{ background: `${pri.color}15`, color: pri.color, border: `1px solid ${pri.color}30`, fontSize: '10px', padding: '1px 6px' }}>
                              {pri.label}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{task.assignee}</span>
                            <span style={{ fontSize: '10px', color: task.category === 'overdue' ? 'var(--color-red)' : 'var(--text-muted)', fontWeight: task.category === 'overdue' ? 'var(--font-weight-semibold)' : 'normal' }}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
