import React from 'react';

function ScoreRing({ score, color, size = 120 }) {
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Feasibility score: ${score} out of 100`}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="28" fontWeight="800" fontFamily="var(--font-family)">
          {score}
        </text>
      </svg>
      <div style={{
        fontSize: 'var(--font-size-xs)', fontWeight: 600, textAlign: 'center',
        padding: '2px 12px', borderRadius: 'var(--radius-full)',
        background: score >= 80 ? 'var(--color-green-surface)' : score >= 50 ? 'var(--color-orange-surface)' : 'rgba(244,63,94,0.1)',
        color: score >= 80 ? 'var(--color-green)' : score >= 50 ? 'var(--color-orange)' : '#f43f5e',
      }}>
        {score >= 80 ? 'Highly Feasible' : score >= 50 ? 'Feasible with Conditions' : 'Not Recommended'}
      </div>
    </div>
  );
}

function SeverityBadge({ risk }) {
  const hasNegatives = ['risk', 'issue', 'concern', 'age', 'need', 'require'].some(w => risk?.toLowerCase().includes(w));
  const severity = hasNegatives ? 'medium' : 'low';
  const cfg = {
    high: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', dot: '#f43f5e', label: 'High' },
    medium: { bg: 'rgba(255,138,29,0.1)', text: 'var(--color-orange)', dot: 'var(--color-orange)', label: 'Medium' },
    low: { bg: 'rgba(34,197,94,0.1)', text: 'var(--color-green)', dot: 'var(--color-green)', label: 'Low' },
  };
  const c = cfg[severity] || cfg.low;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 600, background: c.bg, color: c.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

export default function AIAnalysis({ survey }) {
  if (!survey) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-sparkles" /></svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>AI Feasibility Analysis</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>Complete the survey form and submit to run the AI feasibility analysis.</p>
      </div>
    );
  }

  const hasResults = survey.feasibility_score !== null && survey.feasibility_score !== undefined;
  const score = survey.feasibility_score || 0;
  const scoreColor = score >= 80 ? 'var(--color-green)' : score >= 50 ? 'var(--color-orange)' : '#f43f5e';
  const risks = survey.identified_risks || [];
  const recommendations = survey.recommendations || [];

  if (survey.status === 'ai_analysis') {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto var(--space-4)' }} />
        <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4, margin: '0 auto var(--space-2)' }} />
        <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 4, margin: '0 auto' }} />
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-sparkles" /></svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>No Analysis Yet</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>Submit the survey form to generate the AI feasibility report.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: 'var(--color-purple-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <use href="#icon-sparkles" />
            </svg>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Feasibility Overview</h3>
          <span style={{
            marginLeft: 'auto', fontSize: '10px', fontWeight: 600,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: 'var(--color-purple-surface)', color: 'var(--color-purple)',
          }}>
            AI Generated
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          <ScoreRing score={score} label={survey.feasibility_status || 'Score'} color={scoreColor} />
          <div className="card-grid card-grid-3">
            {[
              { value: `${survey.usable_area_sqft || 0}`, label: 'Usable Area (sq ft)', icon: 'icon-layout-dashboard', color: 'var(--color-blue)' },
              { value: `${survey.area_required_sqft || 0}`, label: 'Area Required (sq ft)', icon: 'icon-roof', color: 'var(--color-orange)' },
              { value: `${survey.cable_run_estimate_meters || 0}m`, label: 'Cable Run', icon: 'icon-route', color: 'var(--color-purple)' },
              { value: `₹${(survey.estimated_additional_cost_rs || 0).toLocaleString('en-IN')}`, label: 'Est. Additional Cost', icon: 'icon-calculator', color: '#f43f5e' },
              { value: survey.mounting_structure_type || 'N/A', label: 'Mounting Structure', icon: 'icon-wrench', color: 'var(--color-green)' },
              { value: survey.area_required_sqft && survey.usable_area_sqft ? `${Math.round((survey.usable_area_sqft / survey.area_required_sqft) * 100)}%` : 'N/A', label: 'Area Utilization', icon: 'icon-trending', color: 'var(--color-blue)' },
            ].map((m, i) => (
              <div key={i} className="card-metric" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div className="card-metric-label" style={{ fontSize: 'var(--font-size-xs)' }}>{m.label}</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <use href={`#${m.icon}`} />
                  </svg>
                </div>
                <div className="card-metric-value" style={{ fontSize: 'var(--font-size-base)', color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {survey.site_assessment_summary && (
        <div className="card-glass" style={{ padding: 'var(--space-5)', borderLeft: '3px solid var(--color-blue)' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-reports" /></svg>
            Site Assessment Summary
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{survey.site_assessment_summary}</p>
        </div>
      )}

      {survey.shading_impact_note && (
        <div className="card-glass" style={{ padding: 'var(--space-5)', borderLeft: '3px solid var(--color-orange)' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-alert-triangle" /></svg>
            Shading Impact
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{survey.shading_impact_note}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {risks.length > 0 && (
          <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-alert-triangle" /></svg>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, margin: 0, color: '#f43f5e' }}>Identified Risks</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {risks.map((risk, idx) => (
                <div key={idx} style={{
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
                  padding: 'var(--space-3) var(--space-3)', background: 'rgba(244,63,94,0.03)',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(244,63,94,0.1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#f43f5e' }}>Risk #{idx + 1}</span>
                    <SeverityBadge risk={risk} />
                  </div>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><use href="#icon-shield" /></svg>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, margin: 0, color: 'var(--color-green)' }}>Recommendations</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recommendations.map((rec, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-3)', background: 'rgba(34,197,94,0.03)',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.1)',
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-green-surface)', color: 'var(--color-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}>{idx + 1}</span>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec}</span>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-green)', marginTop: 2 }}>Recommended Action</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}