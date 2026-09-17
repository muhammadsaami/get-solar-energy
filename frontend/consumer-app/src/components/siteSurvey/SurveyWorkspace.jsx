import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSurvey } from '../../contexts/SiteSurveyContext';
import CustomerSummary from './CustomerSummary';
import SurveyForm from './SurveyForm';
import PhotoGallery from './PhotoGallery';
import AIAnalysis from './AIAnalysis';
import SurveyChecklist from './SurveyChecklist';
import SurveyReport from './SurveyReport';
import SurveyTimeline from './SurveyTimeline';
import { siteSurveyService } from '../../services/siteSurvey.service';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'icon-home' },
  { id: 'form', label: 'Survey Form', icon: 'icon-clipboard' },
  { id: 'photos', label: 'Photos', icon: 'icon-camera' },
  { id: 'ai', label: 'AI Analysis', icon: 'icon-sparkles' },
  { id: 'checklist', label: 'Checklist', icon: 'icon-clipboard-check' },
  { id: 'report', label: 'Report', icon: 'icon-reports' },
  { id: 'timeline', label: 'Timeline', icon: 'icon-route' },
];

const STATUS_ACTIONS = {
  scheduled: [{ status: 'assigned', label: 'Assign & Start', icon: 'icon-arrow-right' }],
  assigned: [{ status: 'traveling', label: 'Mark Traveling', icon: 'icon-route' }],
  traveling: [{ status: 'on_site', label: 'Arrived On Site', icon: 'icon-mappin' }],
  on_site: [{ status: 'uploading', label: 'Start Upload', icon: 'icon-camera' }],
  uploading: [{ status: 'ai_analysis', label: 'Run AI Analysis', icon: 'icon-sparkles' }],
  ai_analysis: [{ status: 'review', label: 'Send to Review', icon: 'icon-clipboard-check' }],
  review: [
    { status: 'approved', label: 'Approve Survey', icon: 'icon-shield' },
    { status: 'changes_requested', label: 'Request Changes', icon: 'icon-close' },
  ],
  approved: [{ status: 'proposal_ready', label: 'Mark Proposal Ready', icon: 'icon-reports' }],
  changes_requested: [{ status: 'on_site', label: 'Return to Site', icon: 'icon-mappin' }],
};

export default function SurveyWorkspace({ survey }) {
  const { updateSurvey, updateStatus, updateChecklist: contextUpdateChecklist, runAiFeasibility } = useSiteSurvey();
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [handoffBusy, setHandoffBusy] = useState(false);
  const navigate = useNavigate();

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      const updated = await updateSurvey(survey.id, formData);
      if (updated && formData.roof_type && formData.city) {
        await updateStatus(survey.id, 'uploading');
        const aiResult = await runAiFeasibility({
          customer_name: formData.customer_name || survey.customer_name,
          city: formData.city,
          roof_type: formData.roof_type,
          roof_age_years: parseInt(formData.roof_age_years) || 0,
          total_roof_area_sqft: parseFloat(formData.total_roof_area_sqft) || 0,
          shading_present: formData.shading_present === true || formData.shading_present === 'Yes',
          shading_details: formData.shading_details || 'None',
          obstacles: formData.obstacles || 'None',
          electrical_panel_distance_m: parseFloat(formData.electrical_panel_distance_m) || 0,
          structure_condition: formData.structure_condition || 'Good',
          proposed_system_kw: parseFloat(formData.proposed_system_kw) || 0,
        });
        if (aiResult?.success && aiResult?.data) {
          await updateSurvey(survey.id, aiResult.data);
          await updateStatus(survey.id, 'review');
          setActiveTab('ai');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistUpdate = async (checklist) => {
    try { await contextUpdateChecklist(survey.id, checklist); } catch (e) { console.error('Checklist error:', e); }
  };

  const handleStatusTransition = async (newStatus) => {
    try { await updateStatus(survey.id, newStatus); } catch (e) { console.error('Status transition error:', e); }
  };

  const handleGenerateProposal = async () => {
    navigate(`/app/planning/proposal`, { state: { surveyId: survey.id, prefill: true } });
  };

  const handleHandoffInstallation = async () => {
    setHandoffBusy(true);
    try {
      const result = await siteSurveyService.handoffInstallation(survey.id);
      if (result) {
        navigate(`/app/installation/progress`, { state: { customerId: survey.customer_id, installationId: result.id } });
      }
    } catch (e) {
      console.error('Handoff error:', e);
    } finally {
      setHandoffBusy(false);
    }
  };

  const availableActions = STATUS_ACTIONS[survey.status] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <CustomerSummary survey={survey} />

      {survey.status !== 'cancelled' && availableActions.length > 0 && (
        <div style={{
          display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap',
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: 'middle' }}>
              <use href="#icon-arrow-right" />
            </svg>
            Next Step:
          </span>
          {availableActions.map((action) => (
            <button
              key={action.status}
              className="btn btn-primary btn-sm"
              onClick={() => handleStatusTransition(action.status)}
              disabled={saving}
              aria-label={action.label}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <use href={`#${action.icon}`} />
              </svg>
              {action.label}
            </button>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleStatusTransition('cancelled')}
            style={{ marginLeft: 'auto', color: 'var(--color-red)' }}
            aria-label="Cancel survey"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <use href="#icon-close" />
            </svg>
            Cancel
          </button>
        </div>
      )}

      {survey.status === 'approved' && (
        <div style={{
          display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap',
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--gradient-brand)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-primary-20)',
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#fff' }}>
            Cross-Module Actions:
          </span>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={handleGenerateProposal}
            aria-label="Generate Proposal"
          >
            Generate Proposal
          </button>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={handleHandoffInstallation}
            disabled={handoffBusy}
            aria-label="Create Installation"
          >
            {handoffBusy ? 'Creating...' : 'Create Installation'}
          </button>
        </div>
      )}

      <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)',
          padding: 'var(--space-2)', background: 'var(--bg-tertiary)',
          overflowX: 'auto',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                border: 'none', borderRadius: 'var(--radius-md)',
                background: activeTab === tab.id ? 'var(--glass-bg)' : 'transparent',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                whiteSpace: 'nowrap',
              }}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${tab.icon}`} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 'var(--space-5)' }} role="tabpanel" aria-label={TABS.find(t => t.id === activeTab)?.label}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)' }}>
              <AIAnalysis survey={survey} />
              <SurveyTimeline status={survey.status} />
            </div>
          )}
          {activeTab === 'form' && <SurveyForm survey={survey} onSubmit={handleFormSubmit} loading={saving} />}
          {activeTab === 'photos' && <PhotoGallery surveyId={survey.id} />}
          {activeTab === 'ai' && <AIAnalysis survey={survey} />}
          {activeTab === 'checklist' && <SurveyChecklist survey={survey} onUpdate={handleChecklistUpdate} />}
          {activeTab === 'report' && <SurveyReport survey={survey} />}
          {activeTab === 'timeline' && <SurveyTimeline status={survey.status} />}
        </div>
      </div>
    </div>
  );
}