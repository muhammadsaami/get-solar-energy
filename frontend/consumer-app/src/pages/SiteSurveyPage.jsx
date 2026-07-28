import React, { useEffect, useState } from 'react';
import { useSiteSurvey } from '../contexts/SiteSurveyContext';
import SiteSurveyDashboard from '../components/siteSurvey/SiteSurveyDashboard';
import SurveyList from '../components/siteSurvey/SurveyList';
import SurveyWorkspace from '../components/siteSurvey/SurveyWorkspace';

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
      <div style={{ paddingBottom: 'var(--space-12)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
            aria-label="Back to dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Surveys
          </button>
        </div>
        <SurveyWorkspace survey={currentSurvey} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <SiteSurveyDashboard onNewSurvey={() => {}} onAction={handleAction} />

      <div className="card-glass" style={{ marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 0,
          padding: 'var(--space-1)', background: 'var(--bg-tertiary)',
        }}>
          {[
            { id: 'list', label: 'List', icon: 'icon-clipboard' },
            { id: 'calendar', label: 'Calendar', icon: 'icon-calendar' },
            { id: 'map', label: 'Map', icon: 'icon-mappin' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setWorkspaceView(tab.id)}
              style={{
                flex: 1, padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                border: 'none', borderRadius: 'var(--radius-md)',
                background: workspaceView === tab.id ? 'var(--glass-bg)' : 'transparent',
                fontWeight: workspaceView === tab.id ? 600 : 400,
                color: workspaceView === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
              }}
              aria-label={`${tab.label} view`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${tab.icon}`} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {workspaceView === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                All Surveys
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0' }}>
                {surveys.length} survey(s) found
              </p>
            </div>
          </div>
          <SurveyList surveys={surveys} onSelect={handleSelectSurvey} onCreate={() => {}} />
        </div>
      )}

      {workspaceView === 'calendar' && (
        <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-5)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <use href="#icon-calendar" />
            </svg>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>
            Calendar View
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0, maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
            A calendar view of all scheduled surveys will be available soon. Switch to List view to manage surveys.
          </p>
        </div>
      )}

      {workspaceView === 'map' && (
        <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-5)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <use href="#icon-mappin" />
            </svg>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>
            Map View
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0, maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
            A geographic view of survey locations will be available soon. Switch to List view to manage surveys.
          </p>
        </div>
      )}
    </div>
  );
}