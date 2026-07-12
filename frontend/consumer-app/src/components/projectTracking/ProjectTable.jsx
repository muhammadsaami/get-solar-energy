import React, { useState, useCallback, useMemo } from 'react';
import { MdMoreVert, MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import { STAGES } from '../../services/projectTracking.service';

const COLUMNS = [
  { key: 'id', label: 'Project ID', sortable: true },
  { key: 'customerName', label: 'Customer', sortable: true },
  { key: 'city', label: 'Location', sortable: true },
  { key: 'capacityKw', label: 'Capacity', sortable: true },
  { key: 'currentStage', label: 'Stage', sortable: true },
  { key: 'assignedEngineer', label: 'Engineer', sortable: true },
  { key: 'assignedInstaller', label: 'Installer', sortable: true },
  { key: 'completionPercent', label: 'Completion', sortable: true },
  { key: 'revenue', label: 'Revenue', sortable: true },
  { key: 'health', label: 'Health', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true }
];

const PAGE_SIZE = 10;

const formatCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${(val / 1000).toFixed(0)}K`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function ProjectTable({ projects, loading, error, onSelectProject, onStageChange }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
  const [currentPage, setCurrentPage] = useState(1);
  const [stageMenuOpen, setStageMenuOpen] = useState(null);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'none' };
    });
  }, []);

  const sortedProjects = useMemo(() => {
    if (!sortConfig.key || sortConfig.direction === 'none') return projects;
    const sorted = [...projects];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'assignedEngineer') { aVal = a.assignedEngineer.name; bVal = b.assignedEngineer.name; }
      if (sortConfig.key === 'assignedInstaller') { aVal = a.assignedInstaller.name; bVal = b.assignedInstaller.name; }
      if (sortConfig.key === 'revenue') { aVal = a.revenue.actual || a.revenue.budget; bVal = b.revenue.actual || b.revenue.budget; }
      if (sortConfig.key === 'health') { aVal = a.health.score; bVal = b.health.score; }
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [projects, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  const pageProjects = sortedProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getSortClass = (key) => {
    if (sortConfig.key !== key) return 'sortable';
    return `sortable sort-${sortConfig.direction === 'asc' ? 'asc' : 'desc'}`;
  };

  if (loading) {
    return (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {COLUMNS.map(col => <th key={col.key} style={{ minWidth: col.key === 'projectName' ? '200px' : '100px' }}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {COLUMNS.map(col => (
                  <td key={col.key}><div className="skeleton skeleton-text" style={{ width: col.key === 'id' ? '80px' : col.key === 'capacityKw' ? '60px' : '120px' }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-container">
        <div className="table-empty">
          <div className="table-empty-icon" style={{ color: 'var(--color-red)' }}>⚠️</div>
          <div className="table-empty-title">Failed to load projects</div>
          <div className="table-empty-desc">{error}</div>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="table-container">
        <div className="table-empty">
          <div className="table-empty-icon"><MdSearch /></div>
          <div className="table-empty-title">No projects found</div>
          <div className="table-empty-desc">Try adjusting your search or filter criteria to find what you're looking for.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table table-hover">
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={col.sortable ? getSortClass(col.key) : ''}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={col.sortable ? 0 : undefined}
                onKeyDown={col.sortable ? (e) => { if (e.key === 'Enter') handleSort(col.key); } : undefined}
              >
                {col.label}
              </th>
            ))}
            <th style={{ width: '50px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageProjects.map(project => (
            <tr
              key={project.id}
              onClick={() => onSelectProject(project)}
              style={{ cursor: 'pointer' }}
            >
              <td className="td-primary td-mono">{project.id}</td>
              <td className="td-primary">{project.customerName}</td>
              <td>{project.city}</td>
              <td><span className="badge badge-neutral badge-sm">{project.capacityKw}kW</span></td>
              <td>
                <div style={{ position: 'relative' }}>
                  <button
                    className={`badge badge-sm ${STAGES.find(s => s.id === project.currentStage)?.id === 'lead' ? 'badge-info' : STAGES.find(s => s.id === project.currentStage)?.id === 'installation' ? 'badge-orange' : STAGES.find(s => s.id === project.currentStage)?.id === 'completed' || STAGES.find(s => s.id === project.currentStage)?.id === 'amc' ? 'badge-success' : 'badge-neutral'}`}
                    onClick={(e) => { e.stopPropagation(); setStageMenuOpen(stageMenuOpen === project.id ? null : project.id); }}
                    style={{ cursor: 'pointer' }}
                    aria-label={`Change stage for ${project.projectName}`}
                    aria-expanded={stageMenuOpen === project.id}
                  >
                    {STAGES.find(s => s.id === project.currentStage)?.label || project.currentStage} ▾
                  </button>
                  {stageMenuOpen === project.id && (
                    <div
                      className="dropdown-menu"
                      style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, minWidth: '160px' }}
                      role="menu"
                    >
                      {STAGES.map(stage => (
                        <button
                          key={stage.id}
                          className="dropdown-item"
                          onClick={(e) => { e.stopPropagation(); onStageChange(project.id, stage.id); setStageMenuOpen(null); }}
                          disabled={stage.id === project.currentStage}
                          role="menuitem"
                          style={stage.id === project.currentStage ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          {stage.icon} {stage.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <div className="avatar avatar-xs" style={{ background: 'var(--color-blue)', fontSize: '9px' }}>{project.assignedEngineer.name.charAt(0)}</div>
                  <span style={{ fontSize: 'var(--font-size-sm)' }}>{project.assignedEngineer.name.split(' ')[0]}</span>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <div className="avatar avatar-xs" style={{ background: 'var(--color-purple)', fontSize: '9px' }}>{project.assignedInstaller.name.charAt(0)}</div>
                  <span style={{ fontSize: 'var(--font-size-sm)' }}>{project.assignedInstaller.name.split(' ')[0]}</span>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div className="progress-track" style={{ width: '60px', height: '4px' }}>
                    <div className={`progress-fill ${project.completionPercent >= 100 ? 'green' : ''}`} style={{ width: `${project.completionPercent}%` }} />
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{project.completionPercent}%</span>
                </div>
              </td>
              <td className="td-primary">{formatCurrency(project.revenue.actual || project.revenue.budget)}</td>
              <td>
                <span className={`badge badge-sm ${project.health.label === 'Healthy' ? 'badge-success' : project.health.label === 'At Risk' ? 'badge-warning' : 'badge-error'}`}>
                  {project.health.label}
                </span>
              </td>
              <td>
                <span className={`badge badge-sm ${project.status === 'completed' ? 'badge-success' : project.status === 'delayed' ? 'badge-error' : project.status === 'at-risk' ? 'badge-warning' : 'badge-info'}`}>
                  {project.status === 'on-track' ? 'On Track' : project.status === 'at-risk' ? 'At Risk' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </td>
              <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{formatDate(project.lastUpdated)}</td>
              <td className="td-actions">
                <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); onSelectProject(project); }} aria-label="View project details">
                  <MdMoreVert />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="table-pagination">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedProjects.length)} of {sortedProjects.length}
          </span>
          <div className="table-pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <MdChevronLeft />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <MdChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
