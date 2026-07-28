import React from 'react';

function ReportSection({ title, icon, children }) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--color-orange-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href={`#${icon}`} />
          </svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SurveyReport({ survey }) {
  if (!survey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16) var(--space-8)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-reports" /></svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>Survey Report</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>Select a survey with AI analysis completed to view the report.</p>
      </div>
    );
  }

  const risks = survey.identified_risks || [];
  const recommendations = survey.recommendations || [];
  const hasData = survey.feasibility_score !== null;

  if (!hasData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16) var(--space-8)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-reports" /></svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>Report Not Ready</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>Run the AI feasibility analysis first to generate the report.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Site Survey Report</h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '2px 0 0' }}>{survey.customer_name} &middot; {survey.city || 'Location N/A'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-outline btn-sm" aria-label="Export PDF">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
          <button className="btn btn-outline btn-sm" aria-label="Print report">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <ReportSection title="Executive Summary" icon="icon-reports">
        <div className="card-grid card-grid-4" style={{ marginBottom: 'var(--space-4)' }}>
          {[
            { label: 'Feasibility Score', value: `${survey.feasibility_score}/100`, color: survey.feasibility_score >= 80 ? 'var(--color-green)' : survey.feasibility_score >= 50 ? 'var(--color-orange)' : '#f43f5e' },
            { label: 'Status', value: survey.feasibility_status || 'N/A', color: 'var(--color-blue)' },
            { label: 'Usable Area', value: `${survey.usable_area_sqft || 0} sq ft`, color: 'var(--color-purple)' },
            { label: 'System Size', value: `${survey.proposed_system_kw || 0} kW`, color: 'var(--color-orange)' },
          ].map((m, i) => (
            <div key={i} className="card-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="card-metric-label" style={{ fontSize: 'var(--font-size-xs)' }}>{m.label}</div>
              <div className="card-metric-value" style={{ fontSize: 'var(--font-size-base)', color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
        {survey.site_assessment_summary && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{survey.site_assessment_summary}</p>
        )}
      </ReportSection>

      <ReportSection title="Site Details" icon="icon-mappin">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[
            { label: 'Customer', value: survey.customer_name },
            { label: 'City', value: survey.city || 'N/A' },
            { label: 'Roof Type', value: survey.roof_type || 'N/A' },
            { label: 'Roof Age', value: survey.roof_age_years ? `${survey.roof_age_years} years` : 'N/A' },
            { label: 'Total Roof Area', value: survey.total_roof_area_sqft ? `${survey.total_roof_area_sqft} sq ft` : 'N/A' },
            { label: 'Structure Condition', value: survey.structure_condition || 'N/A' },
            { label: 'Shading', value: survey.shading_present ? 'Present' : 'None' },
            { label: 'Surveyor', value: survey.assigned_name || 'Unassigned' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </ReportSection>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        {risks.length > 0 && (
          <ReportSection title="Risk Analysis" icon="icon-alert-triangle">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {risks.map((risk, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-3)', background: 'rgba(244,63,94,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244,63,94,0.1)' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 'var(--radius-sm)', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{idx + 1}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{risk}</span>
                </div>
              ))}
            </div>
          </ReportSection>
        )}
        {recommendations.length > 0 && (
          <ReportSection title="AI Recommendations" icon="icon-shield">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recommendations.map((rec, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-3)', background: 'rgba(34,197,94,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 'var(--radius-sm)', background: 'var(--color-green-surface)', color: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{idx + 1}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec}</span>
                </div>
              ))}
            </div>
          </ReportSection>
        )}
      </div>

      <ReportSection title="Electrical Assessment" icon="icon-energy-production">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[
            { label: 'Panel Distance', value: `${survey.electrical_panel_distance_m || 0}m` },
            { label: 'Cable Run Estimate', value: `${survey.cable_run_estimate_meters || 0}m` },
            { label: 'Mounting Structure', value: survey.mounting_structure_type || 'N/A' },
            { label: 'Est. Additional Cost', value: `₹${(survey.estimated_additional_cost_rs || 0).toLocaleString('en-IN')}` },
          ].map((item, i) => (
            <div key={i} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Readiness & Recommendations" icon="icon-clipboard-check">
        <div style={{
          padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
          background: survey.status === 'proposal_ready' ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)',
          border: `1px solid ${survey.status === 'proposal_ready' ? 'rgba(34,197,94,0.2)' : 'var(--border-color)'}`,
        }}>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: survey.status === 'proposal_ready' ? 'var(--color-green)' : 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            {survey.status === 'proposal_ready' ? 'Ready for Proposal' : 'Awaiting Completion'}
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            {survey.status === 'proposal_ready'
              ? 'This site has been fully surveyed and analyzed. Proceed to generate the solar proposal.'
              : `Current status: ${survey.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Draft'}. Complete all steps to generate the proposal.`}
          </p>
        </div>
      </ReportSection>
    </div>
  );
}