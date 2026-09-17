import React, { useEffect, useState } from 'react';
import { useSiteSurvey } from '../contexts/SiteSurveyContext';
import SiteSurveyDashboard from '../components/siteSurvey/SiteSurveyDashboard';
import SurveyList from '../components/siteSurvey/SurveyList';
import SurveyWorkspace from '../components/siteSurvey/SurveyWorkspace';

const IcoClipboard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)
const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcoMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

export default function SiteSurveyPage() {
  const { surveys, currentSurvey, setCurrentSurvey, fetchSurveys, fetchDashboard } = useSiteSurvey();
  const [view, setView] = useState('dashboard');
  const [workspaceView, setWorkspaceView] = useState('list');

  useEffect(() => {
    fetchDashboard();
    fetchSurveys();
  }, [fetchDashboard, fetchSurveys]);

  const handleSelectSurvey = (survey) => {
    setCurrentSurvey(survey);
    setView('workspace');
  };

  const handleBack = () => {
    setCurrentSurvey(null);
    setView('dashboard');
    fetchSurveys();
    fetchDashboard();
  };

  const handleAction = (action) => {
    console.debug('Survey action:', action);
  };

  if (view === 'workspace' && currentSurvey) {
    return (
      <div className="ew-page">
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
            aria-label="Back to surveys"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Site Surveys
          </button>
        </div>
        <SurveyWorkspace survey={currentSurvey} />
      </div>
    );
  }

  return (
    <div className="ew-page">
      <SiteSurveyDashboard onNewSurvey={() => {}} onAction={handleAction} />

      <div className="card-glass" style={{ padding: '4px 6px' }}>
        <div className="ew-nav-pill-bar">
          {[
            { id: 'list', label: 'Survey Roster', icon: <IcoClipboard /> },
            { id: 'calendar', label: 'Field Schedule', icon: <IcoCalendar /> },
            { id: 'map', label: 'Geographic Coverage', icon: <IcoMapPin /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setWorkspaceView(tab.id)}
              className={`ew-nav-pill ${workspaceView === tab.id ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              aria-label={`${tab.label} view`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {workspaceView === 'list' && (
        <div>
          <div className="ew-divider-head">
            <h2 className="ew-divider-title">Field Survey Assignments</h2>
            <span className="ew-divider-sub">{surveys.length} survey(s) registered</span>
          </div>
          <SurveyList surveys={surveys} onSelect={handleSelectSurvey} onCreate={() => {}} />
        </div>
      )}

      {workspaceView === 'calendar' && (
        <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-md)',
            background: 'rgba(23,168,229,0.1)', border: '1px solid rgba(23,168,229,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)', color: 'var(--color-cyan)',
          }}>
            <IcoCalendar />
          </div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>
            Calendar Schedule View
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0, maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
            Interactive timeline view for scheduled solar surveys. Switch to Roster view to inspect individual assessments.
          </p>
        </div>
      )}

      {workspaceView === 'map' && (
        <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-md)',
            background: 'rgba(255,138,29,0.1)', border: '1px solid rgba(255,138,29,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)', color: 'var(--color-orange)',
          }}>
            <IcoMapPin />
          </div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>
            Geographic Coverage Matrix
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0, maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
            Live geospatial distribution of residential surveys across metropolitan regions.
          </p>
        </div>
      )}
    </div>
  );
}