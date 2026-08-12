import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import { SecuritySessionManager } from '../../settings/components/SecuritySessionManager'

export function VendorSettings() {
  const [autoAssign, setAutoAssign] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [escrowAlerts, setEscrowAlerts] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <DashboardHeader
        title="Organization Settings"
        subtitle="Configure EPC organization defaults, dispatch automation rules, and active security sessions."
        badgeText="Configuration"
      />

      <div className="vendor-glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 20px', fontFamily: "'Outfit', sans-serif" }}>
          Vendor Notification &amp; Auto-Dispatch Preferences
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px', color: '#FFFFFF', cursor: 'pointer', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontWeight: 700 }}>Auto-assign field crews by proximity</div>
              <div style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>Automatically assign nearest available engineer team to new installation sites</div>
            </div>
            <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} style={{ accentColor: 'var(--vendor-primary)', width: '18px', height: '18px', cursor: 'pointer' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px', color: '#FFFFFF', cursor: 'pointer', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontWeight: 700 }}>DISCOM Approval SMS Notifications</div>
              <div style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>Receive SMS alerts when bi-directional net meter application status changes</div>
            </div>
            <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} style={{ accentColor: 'var(--vendor-primary)', width: '18px', height: '18px', cursor: 'pointer' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px', color: '#FFFFFF', cursor: 'pointer', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontWeight: 700 }}>Instant Escrow Payout Alerts</div>
              <div style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>Notify finance team immediately upon customer milestone fund release</div>
            </div>
            <input type="checkbox" checked={escrowAlerts} onChange={(e) => setEscrowAlerts(e.target.checked)} style={{ accentColor: 'var(--vendor-primary)', width: '18px', height: '18px', cursor: 'pointer' }} />
          </label>
        </div>

        <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="vendor-btn-primary" onClick={handleSave}>
            Save Preferences
          </button>
          {saved && (
            <span style={{ fontSize: '12px', color: 'var(--vendor-success)', fontWeight: 700 }}>
              ✓ Settings saved successfully
            </span>
          )}
        </div>
      </div>

      {/* Security & Active Session Management */}
      <SecuritySessionManager />
    </div>
  )
}

export default VendorSettings

