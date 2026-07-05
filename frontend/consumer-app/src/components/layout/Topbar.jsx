import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useJourney } from '../../contexts/JourneyContext';
import { MdNotifications, MdLocationOn } from 'react-icons/md';

export default function Topbar() {
  const { user } = useAuth();
  const { getActiveConfig } = useJourney();
  const location = useLocation();

  // Generate simple breadcrumbs from route path
  const pathParts = location.pathname.split('/').filter(x => x && x !== 'app');
  const breadcrumbText = pathParts.length > 0 
    ? pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
    : 'Home';

  const activeJourneyConfig = getActiveConfig();

  return (
    <header className="topbar-container" style={{
      height: '70px',
      background: 'rgba(6, 17, 31, 0.72)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-8)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Breadcrumbs */}
      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
          Portal
        </div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
          {breadcrumbText}
        </div>
      </div>

      {/* Center/Right widgets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Active Journey Stage Indicator badge */}
        <div style={{
          background: 'rgba(255, 138, 29, 0.08)',
          border: '1px solid rgba(255, 138, 29, 0.2)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--color-orange)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span className="pulse-dot green" style={{ width: '6px', height: '6px', background: '#36d399', borderRadius: '50%', display: 'inline-block' }}></span>
          {activeJourneyConfig?.displayName}
        </div>

        {/* Property Switcher placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <MdLocationOn style={{ color: 'var(--color-blue)', fontSize: '16px' }} />
          <span>Delhi Residency</span>
        </div>

        {/* Notifications Icon button */}
        <button style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '22px',
          cursor: 'pointer',
          display: 'flex',
          padding: '6px',
          borderRadius: '50%',
          position: 'relative'
        }} title="Notifications">
          <MdNotifications />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            background: '#f43f5e',
            borderRadius: '50%'
          }}></span>
        </button>

        {/* Avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
            <img src={user.avatar} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          </div>
        )}
      </div>
    </header>
  );
}
