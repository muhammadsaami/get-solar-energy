import React, { useState, useCallback, useRef } from 'react';
import { MdMoreVert } from 'react-icons/md';
import { STAGES } from '../../services/projectTracking.service';

export default function KanbanCard({ project, onStageChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const stageLabel = STAGES.find(s => s.id === project.currentStage)?.label || project.currentStage;
  const priorityColor = project.priority === 'critical' ? 'var(--color-red)' : project.priority === 'high' ? 'var(--color-orange)' : project.priority === 'medium' ? 'var(--color-yellow)' : 'var(--text-muted)';

  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  }, [project.id]);

  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    e.target.classList.remove('dragging');
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setMenuOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setMenuOpen(false);
    }
  }, []);

  const handleStageSelect = useCallback((newStage) => {
    onStageChange(project.id, newStage);
    setMenuOpen(false);
  }, [project.id, onStageChange]);

  return (
    <div
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
              role="option"
              aria-selected={false}
              aria-grabbed={isDragging}
              aria-label={`${project.projectName} — ${stageLabel} — ${project.customerName} — ${project.capacityKw}kW — Health: ${project.health.label}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.projectName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {project.id}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-xs btn-icon"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Change project stage"
            aria-expanded={menuOpen}
            style={{ padding: '2px', fontSize: '16px' }}
          >
            <MdMoreVert />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="dropdown-menu align-right"
              style={{ right: 0, top: '100%', minWidth: '180px', zIndex: 50 }}
              role="menu"
            >
              <div className="dropdown-header">Move to Stage</div>
              {STAGES.map(stage => (
                <button
                  key={stage.id}
                  className={`dropdown-item ${stage.id === project.currentStage ? 'active' : ''}`}
                  onClick={() => handleStageSelect(stage.id)}
                  disabled={stage.id === project.currentStage}
                  role="menuitem"
                  style={stage.id === project.currentStage ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <span>{stage.icon}</span>
                  {stage.label}
                  {stage.id === project.currentStage && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>Current</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span className="badge badge-neutral badge-sm">{project.capacityKw}kW</span>
        <span className={`badge badge-sm ${project.health.label === 'Healthy' ? 'badge-success' : project.health.label === 'At Risk' ? 'badge-warning' : 'badge-error'}`}>
          {project.health.label}
        </span>
        <span className="badge badge-sm" style={{ background: `${priorityColor}15`, color: priorityColor, borderColor: `${priorityColor}30` }}>
          {project.priority}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <div className="avatar avatar-xs" style={{ background: 'var(--color-blue)', fontSize: '9px' }}>
          {project.assignedEngineer.name.charAt(0)}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.assignedEngineer.name}
        </span>
      </div>

      <div>
        <div className="progress-header" style={{ marginBottom: 'var(--space-1)' }}>
          <span className="progress-label" style={{ fontSize: '10px' }}>{project.completionPercent}%</span>
        </div>
        <div className="progress-track" style={{ height: '4px' }}>
          <div className="progress-fill" style={{ width: `${project.completionPercent}%` }} />
        </div>
      </div>

      {project.delayDays > 0 && project.currentStage !== 'completed' && project.currentStage !== 'amc' && (
        <div style={{ fontSize: '10px', color: 'var(--color-red)', marginTop: 'var(--space-1)', fontWeight: 'var(--font-weight-semibold)' }}>
          {project.delayDays}d overdue
        </div>
      )}

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
        {project.customerName} · {project.city}
      </div>
    </div>
  );
}
