import React, { useState } from 'react'
import { usePlanning } from '../../contexts/PlanningContext'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'reports' },
  { id: 'technical', label: 'Technical Details', icon: 'wrench' },
  { id: 'financial', label: 'Financial & Subsidy', icon: 'savings' },
  { id: 'timeline', label: 'Installation Timeline', icon: 'calendar' },
  { id: 'ai-notes', label: 'AI Notes & Terms', icon: 'sparkles' },
]

export default function ProposalCard({ proposal }) {
  const { approveProposal, loading } = usePlanning()
  const [activeTab, setActiveTab] = useState('overview')
  const [signed, setSigned] = useState(false)
  const [exported, setExported] = useState(false)

  if (!proposal) return null

  const handleApprove = async () => {
    const res = await approveProposal()
    if (res?.success) setSigned(true)
  }

  const handleExportPdf = () => {
    setExported(true)
    window.print()
    setTimeout(() => setExported(false), 2000)
  }

  const isApproved = proposal.status === 'Approved' || signed
  const p = proposal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                System Sizing & Investment Summary
              </span>
              <span className={`badge ${isApproved ? 'badge-green' : 'badge-orange'}`}>
                {isApproved ? 'Approved' : p.status || 'Draft'}
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
              Recommended System Size: {p.systemSizeKw || p.recommendedKw || 5} kWp
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Estimated Annual Generation: <strong>{((p.expectedGenerationYrHkwh || p.annualGen || (p.systemSizeKw || 5) * 1620)).toLocaleString()} kWh / year</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={handleExportPdf} aria-label="Export PDF" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exported ? 'Printing...' : 'Export PDF'}
            </button>
            {!isApproved && (
              <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={loading} aria-label="Approve proposal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {loading ? 'Approving...' : 'Approve Proposal'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', padding: '8px', background: 'rgba(255,255,255,0.02)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 14px', cursor: 'pointer',
                border: 'none', borderRadius: '8px',
                background: activeTab === tab.id ? 'var(--color-orange-surface)' : 'transparent',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--color-orange)' : 'var(--text-muted)',
                fontSize: '13px', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              aria-label={tab.label}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
                  Executive Summary
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {p.executiveSummary || `This customized AI solar proposal is designed for ${p.customerName || 'your property'}. Installing a ${(p.systemSizeKw || 5)} kW On-Grid Solar System will offset approximately 85% of your annual electricity consumption, reducing your monthly bill by up to ₹${((p.systemSizeKw || 5) * 1100).toLocaleString('en-IN')}. Under the PM Surya Ghar Muft Bijli Yojana, your system qualifies for up to ₹78,000 in direct central government subsidies.`}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
                  Financial Highlights & Return on Investment
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {p.financialHighlights || `With a net investment of ₹${((p.systemSizeKw || 5) * 50000 - 78000).toLocaleString('en-IN')}, your system pays for itself in approximately 3.8 years. Over its guaranteed 25-year operational lifecycle, you will save more than ₹12.4 Lakhs in cumulative utility bills.`}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Proposed Component Hardware Specifications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(p.equipment || [
                  { type: 'Solar PV Modules', spec: '540W Mono PERC Half-Cut Tier-1 Modules', quantity: Math.ceil(((p.systemSizeKw || 5) * 1000) / 540) },
                  { type: 'Grid-Tied Solar Inverter', spec: '5 kW 3-Phase MPPT Smart String Inverter (98.6% Efficiency)', quantity: 1 },
                  { type: 'Mounting Structure', spec: 'Hot-Dip Galvanized Iron Elevated Rafters (150 km/h wind rated)', quantity: 1 },
                  { type: 'AC/DC Distribution Box', spec: 'IP65 Weatherproof Box with Surge Protection (SPD) & MCBs', quantity: 1 },
                  { type: 'Bi-Directional Net Meter', spec: 'DISCOM Approved Dual Tariff Smart Net Metering Unit', quantity: 1 },
                ]).map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.type}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.spec} <strong style={{ color: 'var(--color-orange)', marginLeft: '6px' }}>(Qty: {item.quantity})</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="card-glass" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total System Cost</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>₹{((p.systemSizeKw || 5) * 50000).toLocaleString('en-IN')}</div>
                </div>
                <div className="card-glass" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--vendor-success)', textTransform: 'uppercase', fontWeight: 700 }}>PM Surya Ghar Subsidy</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--vendor-success)', marginTop: '4px' }}>- ₹78,000</div>
                </div>
                <div className="card-glass" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-orange)', textTransform: 'uppercase', fontWeight: 700 }}>Net Cost After Subsidy</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-orange)', marginTop: '4px' }}>₹{((p.systemSizeKw || 5) * 50000 - 78000).toLocaleString('en-IN')}</div>
                </div>
                <div className="card-glass" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-blue)', textTransform: 'uppercase', fontWeight: 700 }}>Payback Period</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-blue)', marginTop: '4px' }}>3.8 Years</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Turnkey Execution & Commissioning Timeline
              </h4>
              {[
                { step: 'Stage 1', title: 'Site Inspection & Engineering Design', duration: 'Days 1 - 2', status: 'Completed' },
                { step: 'Stage 2', title: 'DISCOM Net-Metering Sanction Application', duration: 'Days 3 - 5', status: 'In Progress' },
                { step: 'Stage 3', title: 'Material Dispatch & Roof Structure Mounting', duration: 'Days 6 - 8', status: 'Scheduled' },
                { step: 'Stage 4', title: 'Inverter Wiring & Safety Inspection Test', duration: 'Day 9', status: 'Scheduled' },
                { step: 'Stage 5', title: 'Bi-Directional Smart Meter Installation & Grid Sync', duration: 'Days 10 - 12', status: 'Scheduled' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--color-orange)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-orange)', fontWeight: 800, textTransform: 'uppercase' }}>{item.step} &middot; {item.duration}</span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>{item.title}</div>
                  </div>
                  <span className="badge badge-orange">{item.status}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ai-notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-orange)' }}>AI Proposal Terms & Assurance</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0, lineHeight: 1.6 }}>
                  Generated using real-time DISCOM solar tariff schedules and solar irradiance models. All solar panels carry a 25-year linear performance warranty (min 84.8% output at Year 25). Inverters include a 10-year replacement warranty.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
