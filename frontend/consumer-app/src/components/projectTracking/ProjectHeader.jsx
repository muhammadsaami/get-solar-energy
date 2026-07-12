import React from 'react';
import { MdAdd, MdFileDownload, MdRefresh } from 'react-icons/md';

export default function ProjectHeader({ onRefresh, projectCount }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-black)', margin: 0, color: 'var(--text-primary)' }}>
          Project Tracking
        </h1>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0' }}>
          Manage and monitor all installation projects across the pipeline. {projectCount !== null && <span style={{ color: 'var(--text-muted)' }}>({projectCount} total)</span>}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-with-icon" onClick={() => {}} title="Add new project">
          <MdAdd style={{ fontSize: '18px' }} /> Add Project
        </button>
        <button className="btn btn-ghost btn-with-icon" onClick={() => {}} title="Export project data">
          <MdFileDownload style={{ fontSize: '18px' }} /> Export
        </button>
        <button className="btn btn-ghost btn-icon" onClick={onRefresh} title="Refresh project data" aria-label="Refresh projects">
          <MdRefresh style={{ fontSize: '20px' }} />
        </button>
      </div>
    </div>
  );
}
