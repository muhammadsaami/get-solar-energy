import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import { useJourney } from '../../contexts/JourneyContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  MdDashboard, MdTimeline, MdReceiptLong, MdRoofing, MdCalculate,
  MdConstruction, MdFactCheck, MdSettingsInputHdmi, MdBolt,
  MdTrendingUp, MdAssessment, MdFolderOpen, MdNotifications,
  MdHelpOutline, MdCardGiftcard, MdPerson, MdSettings, MdLogout,
  MdMenuOpen, MdMenu, MdTrackChanges
} from 'react-icons/md';

export default function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar } = useUI();
  const { isRouteUnlocked } = useJourney();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navGroups = [
    {
      groupName: "Overview",
      items: [
        { label: "Home", path: "/app/home", icon: <MdDashboard /> },
        { label: "My Solar Journey", path: "/app/journey", icon: <MdTimeline /> }
      ]
    },
    {
      groupName: "Planning",
      items: [
        { label: "Electricity Bills", path: "/app/planning/bills", icon: <MdReceiptLong /> },
        { label: "My Roof", path: "/app/planning/roof", icon: <MdRoofing /> },
        { label: "Proposal", path: "/app/planning/proposal", icon: <MdCalculate /> }
      ]
    },
    {
      groupName: "Installation",
      items: [
        { label: "Progress", path: "/app/installation/progress", icon: <MdConstruction /> },
        { label: "Quality Inspection", path: "/app/installation/qa", icon: <MdFactCheck /> },
        { label: "Net Metering", path: "/app/installation/grid", icon: <MdSettingsInputHdmi /> }
      ]
    },
    {
      groupName: "Ownership",
      items: [
        { label: "My Solar System", path: "/app/ownership/system", icon: <MdBolt /> },
        { label: "Savings", path: "/app/ownership/savings", icon: <MdTrendingUp /> },
        { label: "Reports", path: "/app/ownership/reports", icon: <MdAssessment /> },
        { label: "Documents", path: "/app/ownership/docs", icon: <MdFolderOpen /> }
      ]
    },
    {
      groupName: "Support",
      items: [
        { label: "Notifications", path: "/app/support/notifications", icon: <MdNotifications /> },
        { label: "Help Centre", path: "/app/support/help", icon: <MdHelpOutline /> },
        { label: "Refer & Earn", path: "/app/support/referrals", icon: <MdCardGiftcard /> }
      ]
    },
    {
      groupName: "Account",
      items: [
        { label: "Profile", path: "/app/account/profile", icon: <MdPerson /> },
        { label: "Settings", path: "/app/account/settings", icon: <MdSettings /> }
      ]
    },
    {
      groupName: "Vendor Portal",
      items: [
        { label: "Project Tracking", path: "/app/vendor/project-tracking", icon: <MdTrackChanges /> }
      ]
    }
  ];

  return (
    <aside className={`sidebar-container ${isSidebarCollapsed ? 'collapsed' : ''}`} style={{
      width: isSidebarCollapsed ? '80px' : '260px',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      background: 'rgba(8, 24, 42, 0.92)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      transition: 'width var(--duration-normal) var(--ease-standard)',
      overflowY: 'auto'
    }}>
      {/* Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {!isSidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-orange)', letterSpacing: '-0.5px' }}>☀️ GET SOLAR</span>
          </div>
        )}
        <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '20px', display: 'flex', margin: isSidebarCollapsed ? '0 auto' : '0' }}>
          {isSidebarCollapsed ? <MdMenu /> : <MdMenuOpen />}
        </button>
      </div>

      {/* Profile Section */}
      {!isSidebarCollapsed && user && (
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', margin: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <img src={user.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav style={{ flex: 1, padding: '15px' }}>
        {navGroups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: '20px' }}>
            {!isSidebarCollapsed && (
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '10px' }}>
                {group.groupName}
              </div>
            )}
            {group.items.map((item, itemIdx) => {
              const unlocked = isRouteUnlocked(item.path);
              return (
                <NavLink
                  key={itemIdx}
                  to={unlocked ? item.path : '#'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    color: !unlocked ? '#475569' : isActive ? 'var(--color-orange)' : 'var(--text-secondary)',
                    background: isActive && unlocked ? 'rgba(255, 138, 29, 0.08)' : 'transparent',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isActive ? '700' : '500',
                    marginBottom: '4px',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    opacity: unlocked ? 1 : 0.45,
                    transition: 'all var(--duration-fast) var(--ease-standard)'
                  })}
                  title={!unlocked ? "Locked: Progress current stage to access" : item.label}
                >
                  <span style={{ fontSize: '20px', display: 'flex' }}>{item.icon}</span>
                  {!isSidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!unlocked && !isSidebarCollapsed && <span style={{ fontSize: '12px' }}>🔒</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <button onClick={handleLogout} style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.15)',
          borderRadius: '8px',
          color: '#f43f5e',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
          transition: 'all var(--duration-fast) var(--ease-standard)'
        }}>
          <span style={{ fontSize: '20px', display: 'flex' }}><MdLogout /></span>
          {!isSidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
