import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { STAGES } from '../../services/projectTracking.service';
import OverviewTab from './drawerTabs/OverviewTab';
import TimelineTab from './drawerTabs/TimelineTab';
import TeamTab from './drawerTabs/TeamTab';
import FinancialTab from './drawerTabs/FinancialTab';
import DocumentsTab from './drawerTabs/DocumentsTab';
import NotesTab from './drawerTabs/NotesTab';
import RisksTab from './drawerTabs/RisksTab';
import ActivityTab from './drawerTabs/ActivityTab';
import MilestonesTab from './drawerTabs/MilestonesTab';

const TABS = [
  { id: 'overview', label: 'Overview', Component: OverviewTab },
  { id: 'timeline', label: 'Timeline', Component: TimelineTab },
  { id: 'team', label: 'Team', Component: TeamTab },
  { id: 'financial', label: 'Financial', Component: FinancialTab },
  { id: 'documents', label: 'Documents', Component: DocumentsTab },
  { id: 'milestones', label: 'Milestones', Component: MilestonesTab },
  { id: 'risks', label: 'Risks', Component: RisksTab },
  { id: 'notes', label: 'Notes', Component: NotesTab },
  { id: 'activity', label: 'Activity', Component: ActivityTab }
];

export default function ProjectDrawer({ project, isOpen, onClose, activities, onStageChange }) {
  const [activeTab, setActiveTab] = useState('overview');
  const drawerRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Tab') {
      const focusable = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        drawerRef.current?.querySelector('button')?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab('overview');
  }, [project?.id]);

  if (!isOpen || !project) return null;

  const stageInfo = STAGES.find(s => s.id === project.currentStage);
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.Component || OverviewTab;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onKeyDown={handleKeyDown}
        style={{ width: '480px', maxWidth: '95vw' }}
      >
        <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <span className={`badge badge-sm ${project.health.label === 'Healthy' ? 'badge-success' : project.health.label === 'At Risk' ? 'badge-warning' : 'badge-error'}`}>
                  {project.health.label}
                </span>
                <span className="badge badge-sm badge-neutral">{stageInfo?.label || project.currentStage}</span>
              </div>
              <h2 id="drawer-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--text-primary)' }}>
                {project.projectName}
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0' }}>
                {project.customerName} · {project.city} · {project.capacityKw}kW
              </p>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              aria-label="Close drawer"
              style={{ flexShrink: 0 }}
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        <div className="drawer-section-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`drawer-section-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 var(--space-6) var(--space-6)', overflowY: 'auto', flex: 1 }} role="tabpanel" id={`tab-panel-${activeTab}`} aria-labelledby={activeTab}>
          <ActiveComponent project={project} activities={activities} onStageChange={onStageChange} />
        </div>
      </div>
    </>
  );
}
