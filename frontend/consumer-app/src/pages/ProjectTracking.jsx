import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProjects, getProjectKpis, getProjectAnalytics,
  getProjectTasks, getProjectActivities,
  updateProjectStage, searchProjects, filterProjects
} from '../services/projectTracking.service';
import ProjectHeader from '../components/projectTracking/ProjectHeader';
import KpiCards from '../components/projectTracking/KpiCards';
import AdvancedSearch from '../components/projectTracking/AdvancedSearch';
import EnterpriseFilters from '../components/projectTracking/EnterpriseFilters';
import KanbanBoard from '../components/projectTracking/KanbanBoard';
import ProjectTable from '../components/projectTracking/ProjectTable';
import ProjectDrawer from '../components/projectTracking/ProjectDrawer';
import RecentActivity from '../components/projectTracking/RecentActivity';
import UpcomingTasks from '../components/projectTracking/UpcomingTasks';
import ProjectAnalytics from '../components/projectTracking/ProjectAnalytics';
import { MdExpandMore, MdExpandLess, MdWarning, MdRefresh } from 'react-icons/md';
import '../styles/project-tracking.css';

export default function ProjectTracking() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectActivities, setSelectedProjectActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    kpi: true, kanban: true, table: true, analytics: true, activity: true, tasks: true, timeline: true
  });
  const liveRef = useRef(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, kpisRes, analyticsRes, tasksRes, activitiesRes] = await Promise.all([
        getProjects(), getProjectKpis(), getProjectAnalytics(),
        getProjectTasks(), getProjectActivities()
      ]);
      setProjects(projRes);
      setKpis(kpisRes);
      setAnalytics(analyticsRes);
      setTasks(tasksRes);
      setActivities(activitiesRes);
    } catch (err) {
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const applyFiltersAndSearch = async () => {
      try {
        let data = projects;
        if (Object.keys(activeFilters).length > 0) {
          data = await filterProjects(activeFilters);
        }
        if (searchQuery.trim()) {
          data = await searchProjects(searchQuery);
        }
        setFilteredProjects(data);
      } catch {
        setFilteredProjects(projects);
      }
    };
    applyFiltersAndSearch();
  }, [projects, searchQuery, activeFilters]);

  const handleStageChange = useCallback(async (projectId, newStage) => {
    const oldProject = projects.find(p => p.id === projectId);
    if (!oldProject || oldProject.currentStage === newStage) return;

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updated = { ...p, currentStage: newStage, lastUpdated: new Date().toISOString() };
      if (newStage === 'completed' || newStage === 'amc') {
        updated.completionPercent = 100;
        updated.status = 'completed';
      }
      return updated;
    }));

    if (liveRef.current) {
      liveRef.current.textContent = `Project ${oldProject.projectName} moved from ${oldProject.currentStage} to ${newStage}`;
    }

    try {
      await updateProjectStage(projectId, newStage);
      const freshProjects = await getProjects();
      const freshKpis = await getProjectKpis();
      setProjects(freshProjects);
      setKpis(freshKpis);
    } catch (err) {
      setProjects(prev => prev.map(p => p.id === projectId ? oldProject : p));
      setError(`Failed to update stage: ${err.message}`);
    }
  }, [projects]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleFilter = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  const handleSelectProject = useCallback(async (project) => {
    setSelectedProject(project);
    setIsDrawerOpen(true);
    try {
      const projectActivities = await getProjectActivities();
      setSelectedProjectActivities(projectActivities.filter(a =>
        a.description.toLowerCase().includes(project.customerName.toLowerCase()) ||
        a.description.toLowerCase().includes(project.city.toLowerCase())
      ).slice(0, 8));
    } catch {
      setSelectedProjectActivities([]);
    }
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedProject(null);
    setSelectedProjectActivities([]);
  }, []);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const Section = ({ title, sectionKey, children, defaultExpanded = true }) => {
    const isExpanded = expandedSections[sectionKey] !== false;
    return (
      <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          className="card-header"
          style={{ padding: 'var(--space-5) var(--space-6)', cursor: 'pointer', marginBottom: 0, borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none' }}
          onClick={() => toggleSection(sectionKey)}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(sectionKey); } }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h3>
          <div style={{ color: 'var(--text-muted)', fontSize: '20px', display: 'flex' }}>
            {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
          </div>
        </div>
        {isExpanded && (
          <div style={{ padding: 'var(--space-5) var(--space-6)' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  if (error && projects.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <ProjectHeader onRefresh={loadAllData} projectCount={0} />
        <div className="table-empty" style={{ padding: 'var(--space-16) 0' }}>
          <div className="table-empty-icon" style={{ color: 'var(--color-red)' }}><MdWarning size={48} /></div>
          <div className="table-empty-title">Failed to load project data</div>
          <div className="table-empty-desc">{error}</div>
          <button className="btn btn-primary btn-with-icon" onClick={loadAllData}>
            <MdRefresh /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <div aria-live="polite" ref={liveRef} style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }} />

      <ProjectHeader onRefresh={loadAllData} projectCount={projects.length} />

      <Section title="Key Performance Indicators" sectionKey="kpi">
        <KpiCards kpis={kpis} loading={loading} error={error && kpis === null ? error : null} />
      </Section>

      <Section title="Search & Filters" sectionKey="filters" defaultExpanded={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <AdvancedSearch onSearch={handleSearch} />
          <EnterpriseFilters activeFilters={activeFilters} onFilter={handleFilter} />
        </div>
      </Section>

      <Section title={`Kanban Pipeline (${filteredProjects.length} projects)`} sectionKey="kanban">
        <KanbanBoard
          projects={filteredProjects}
          onStageChange={handleStageChange}
          loading={loading}
        />
      </Section>

      <Section title="Projects Table" sectionKey="table">
        <ProjectTable
          projects={filteredProjects}
          loading={loading}
          error={error}
          onSelectProject={handleSelectProject}
          onStageChange={handleStageChange}
        />
      </Section>

      <Section title="Project Analytics" sectionKey="analytics">
        <ProjectAnalytics analytics={analytics} loading={loading} />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <Section title="Recent Activity" sectionKey="activity">
          <RecentActivity activities={activities} loading={loading} />
        </Section>
        <Section title="Upcoming Tasks" sectionKey="tasks">
          <UpcomingTasks tasks={tasks} loading={loading} />
        </Section>
      </div>

      <ProjectDrawer
        project={selectedProject}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        activities={selectedProjectActivities}
        onStageChange={handleStageChange}
      />
    </div>
  );
}
