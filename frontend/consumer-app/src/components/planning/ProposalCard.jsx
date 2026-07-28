import React, { useState } from 'react';
import { usePlanning } from '../../contexts/PlanningContext';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'icon-reports' },
  { id: 'technical', label: 'Technical', icon: 'icon-wrench' },
  { id: 'financial', label: 'Financial', icon: 'icon-annual-savings' },
  { id: 'ai-notes', label: 'AI Notes', icon: 'icon-sparkles' },
];

export default function ProposalCard({ proposal }) {
  const { approveProposal, loading } = usePlanning();
  const [activeTab, setActiveTab] = useState('overview');
  const [signed, setSigned] = useState(false);

  if (!proposal) return null;

  const handleApprove = async () => {
    const res = await approveProposal();
    if (res.success) setSigned(true);
  };

  const isApproved = proposal.status === 'Approved' || signed;
  const p = proposal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href="#icon-reports" />
              </svg>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                System Sizing Summary
              </span>
              <span className={`badge ${isApproved ? 'badge-green' : 'badge-orange'}`}>
                {isApproved ? 'Approved' : p.status}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900, margin: '0 0 var(--space-1)', color: 'var(--text-primary)' }}>
              Recommended Size: {p.systemSizeKw} kWp
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Estimated Annual Generation: <strong>{p.expectedGenerationYrHkwh.toLocaleString()} kWh / year</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-outline btn-sm" aria-label="Download PDF" style={{ background: 'var(--glass-bg)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export PDF
            </button>
            {!isApproved && (
              <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={loading} aria-label="Approve proposal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {loading ? 'Approving...' : 'Approve'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-2)', background: 'var(--bg-tertiary)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                border: 'none', borderRadius: 'var(--radius-md)',
                background: activeTab === tab.id ? 'var(--glass-bg)' : 'transparent',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
              }}
              aria-label={tab.label}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${tab.icon}`} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <Section icon="icon-reports" title="Executive Summary" text={p.executiveSummary} />
              <Section icon="icon-annual-savings" title="Financial Highlights" text={p.financialHighlights} />
              <Section icon="icon-star" title="Why Choose Us" text={p.whyChooseUs} />
            </div>
          )}

          {activeTab === 'technical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <Section icon="icon-wrench" title="System Overview" text={p.systemOverview} />
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-3)' }}>
                  Proposed Component Hardware
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {p.equipment.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-blue-surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <use href="#icon-clipboard" />
                          </svg>
                        </div>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.type}</span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {item.spec} <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>(Qty: {item.quantity})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-grid card-grid-3">
                <MetricCard value={`${p.panelsRequired}`} label="Panels Required" icon="icon-layout-dashboard" color="var(--color-blue)" />
                <MetricCard value={`${p.systemSizeKw} kW`} label="System Capacity" icon="icon-wrench" color="var(--color-orange)" />
                <MetricCard value={`${p.monthlyGenerationUnits.toLocaleString()} kWh`} label="Monthly Generation" icon="icon-energy-production" color="var(--color-green)" />
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <Section icon="icon-annual-savings" title="Financial Highlights" text={p.financialHighlights} />
              <div className="card-grid card-grid-4">
                <MetricCard value={`₹${(p.systemCost || 0).toLocaleString('en-IN')}`} label="System Cost" icon="icon-calculator" color="var(--text-primary)" />
                <MetricCard value={`₹${(p.subsidyAmount || 0).toLocaleString('en-IN')}`} label="Govt Subsidy" icon="icon-annual-savings" color="var(--color-green)" />
                <MetricCard value={`₹${(p.netCost || 0).toLocaleString('en-IN')}`} label="Net Cost" icon="icon-bill" color="var(--color-blue)" />
                <MetricCard value={`₹${(p.monthlySavings || 0).toLocaleString('en-IN')}`} label="Monthly Savings" icon="icon-bill" color="var(--color-orange)" />
                <MetricCard value={`₹${(p.annualSavings || 0).toLocaleString('en-IN')}`} label="Annual Savings" icon="icon-annual-savings" color="var(--color-green)" />
                <MetricCard value={`${(p.paybackYears || 0)} Yrs`} label="Payback Period" icon="icon-calendar" color="var(--color-purple)" />
                <MetricCard value={`₹${(p.lifetimeSavings || 0).toLocaleString('en-IN')}`} label="25-Year Savings" icon="icon-trending" color="var(--color-blue)" />
                <MetricCard value={`${(p.co2OffsetTons || 0)} T/yr`} label="CO₂ Offset" icon="icon-shield" color="var(--color-green)" />
              </div>
            </div>
          )}

          {activeTab === 'ai-notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-4)', background: 'var(--color-orange-surface)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-orange-border)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <use href="#icon-sparkles" />
                </svg>
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-orange)', margin: '0 0 var(--space-1)' }}>AI-Generated Proposal</p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    This proposal was generated by Google Gemini AI based on the data you provided. All financial calculations follow standard Indian solar industry formulas and government subsidy schemes (PM Surya Ghar). Please review all details before approval.
                  </p>
                </div>
              </div>

              {p.termsAndConditions?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-3)' }}>
                    Terms & Conditions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {p.termsAndConditions.map((term, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 'var(--radius-full)',
                          background: 'var(--color-blue-surface)', color: 'var(--color-blue)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'var(--font-size-xs)', fontWeight: 700, flexShrink: 0,
                        }}>{idx + 1}</span>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{term}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, text }) {
  if (!text) return null;
  return (
    <div>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-2)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href={`#${icon}`} />
        </svg>
        {title}
      </h4>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  );
}

function MetricCard({ value, label, icon, color }) {
  return (
    <div className="card-metric" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
        <div className="card-metric-label" style={{ fontSize: 'var(--font-size-xs)' }}>{label}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <use href={`#${icon}`} />
        </svg>
      </div>
      <div className="card-metric-value" style={{ fontSize: 'var(--font-size-lg)', color }}>{value}</div>
    </div>
  );
}
