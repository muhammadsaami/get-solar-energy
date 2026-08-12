import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorReports() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const reports = [
    { title: 'Monthly Financial & Margin Summary', desc: 'Detailed breakdown of project revenues, material costs, and gross margins.', format: 'PDF / CSV', date: 'Jul 2026' },
    { title: 'DISCOM Net-Metering Compliance Log', desc: 'Audit log of submitted bi-directional meter applications and inspect approvals.', format: 'PDF', date: 'Jul 2026' },
    { title: 'Field Crew Utilization & Safety Audit', desc: 'Engineer hours, site safety compliance check results, and field ratings.', format: 'CSV', date: 'Jun 2026' },
    { title: 'GST & Statutory Tax Filing Export', desc: 'Tax invoice aggregation and GST 1/3B reconciliation report for accounting.', format: 'CSV / Excel', date: 'Jul 2026' },
  ]

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Enterprise Reports Center"
        subtitle="Export automated financial statements, DISCOM compliance summaries, and operational audits."
        badgeText={`${reports.length} Template Reports`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Custom Report Builder')}>
            + Build Custom Report
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Standardized Enterprise Reports</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search report templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {filtered.map((r) => (
            <div key={r.title} className="vendor-glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--vendor-primary)', background: 'rgba(23,168,229,0.12)', padding: '3px 9px', borderRadius: '10px', border: '1px solid var(--vendor-primary-border)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {r.format}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', fontWeight: 600 }}>{r.date}</span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>{r.title}</h4>
              <p style={{ fontSize: '12.5px', color: 'var(--vendor-text-secondary)', margin: '0 0 20px', lineHeight: 1.5, fontWeight: 500 }}>{r.desc}</p>
              <button className="vendor-btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => notify(`Downloading ${r.title}`)}>
                Generate & Download Report
              </button>
            </div>
          ))}
        </div>
      ) : (
        <VendorEmptyState
          title="No Reports Match Search"
          description="No report template matching your query was found."
          action={{ label: 'Reset Search', onClick: () => setSearch('') }}
        />
      )}
    </div>
  )
}

export default VendorReports
