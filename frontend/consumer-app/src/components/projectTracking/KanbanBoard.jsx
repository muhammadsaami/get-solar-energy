import React, { useState, useCallback, useRef, useMemo } from 'react';
import KanbanCard from './KanbanCard';
import { STAGES } from '../../services/projectTracking.service';

export default function KanbanBoard({ projects, onStageChange, loading }) {
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const liveRegionRef = useRef(null);
  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  const handleDragOver = useCallback((e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(stageId);
  }, []);

  const handleDragLeave = useCallback((e, stageId) => {
    if (e.currentTarget === e.target || e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e, stageId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const projectId = e.dataTransfer.getData('text/plain');
    if (!projectId) return;
    const project = projectMap[projectId];
    if (!project || project.currentStage === stageId) return;
    onStageChange(projectId, stageId);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Project ${project.projectName} moved to ${STAGES.find(s => s.id === stageId)?.label || stageId}`;
    }
  }, [onStageChange, projectMap]);

  if (loading) {
    return (
      <div className="kanban-board" style={{ display: 'flex', gap: 'var(--space-4)' }}>
        {STAGES.map((stage) => (
          <div key={stage.id} className="kanban-column">
            <div className="kanban-column-header">
              <div className="skeleton skeleton-text medium" />
              <div className="skeleton skeleton-text narrow" />
            </div>
            <div className="kanban-column-body">
              <div className="skeleton skeleton-block" style={{ height: '80px', marginBottom: 'var(--space-3)' }} />
              <div className="skeleton skeleton-block" style={{ height: '80px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div
        aria-live="polite"
        ref={liveRegionRef}
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      />
      <div
        className="kanban-board"
        role="listbox"
        aria-label="Project pipeline by stage"
        aria-multiselectable="false"
      >
        {STAGES.map((stage) => {
          const columnProjects = projects.filter(p => p.currentStage === stage.id);
          return (
            <div
              key={stage.id}
              className={`kanban-column ${dragOverColumn === stage.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              role="presentation"
              aria-label={`${stage.label} — ${columnProjects.length} projects`}
            >
              <div className="kanban-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span>{stage.icon}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                    {stage.label}
                  </span>
                </div>
                <span className={`badge badge-sm`} style={{ background: `${stage.color}20`, color: stage.color, border: `1px solid ${stage.color}30` }}>
                  {columnProjects.length}
                </span>
              </div>
              <div className="kanban-column-body">
                {columnProjects.length === 0 ? (
                  <div className="kanban-column-empty">No projects in this stage</div>
                ) : (
                  columnProjects.map(project => (
                    <KanbanCard
                      key={project.id}
                      project={project}
                      onStageChange={onStageChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
