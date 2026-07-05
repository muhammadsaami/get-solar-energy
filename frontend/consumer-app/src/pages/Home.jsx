import React from 'react';
import { useJourney } from '../contexts/JourneyContext';
import { useAuth } from '../contexts/AuthContext';
import { MdTrendingUp, MdArrowForward, MdOutlineAccessTime, MdCheckCircle } from 'react-icons/md';

export default function Home() {
  const { user } = useAuth();
  const { getActiveConfig, getProgressPercentage } = useJourney();

  const activeConfig = getActiveConfig();
  const progress = getProgressPercentage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Greeting Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          Welcome back, {user?.name || 'Homeowner'} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          Here is the status of your residential solar intelligence installation.
        </p>
      </div>

      {/* 1. Journey Banner & Active Action Block */}
      <div className="glass-card" style={{
        padding: '35px 30px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(8, 24, 42, 0.85) 0%, rgba(6, 15, 31, 0.95) 100%)',
        boxShadow: 'var(--glass-shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Progress Background Shimmer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--color-blue), var(--color-orange))',
          width: `${progress}%`,
          transition: 'width var(--duration-normal) var(--ease-standard)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{
              background: 'rgba(255, 138, 29, 0.08)',
              border: '1px solid rgba(255, 138, 29, 0.2)',
              color: 'var(--color-orange)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '850',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              Current Stage: {activeConfig.displayName}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              {activeConfig.description}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px' }}>
              Completion Criteria: {activeConfig.completionRules}. Estimated duration: {activeConfig.etaDays} {activeConfig.etaDays === 1 ? 'day' : 'days'}.
            </p>
          </div>

          {activeConfig.customerAction !== 'NONE' && (
            <a href={activeConfig.unlockRoutes[activeConfig.unlockRoutes.length - 1]} style={{
              background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
              color: 'white',
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 30px rgba(255, 138, 29, 0.25)',
              transition: 'all var(--duration-fast) var(--ease-standard)'
            }}>
              Complete {activeConfig.customerAction.replace('_', ' ')}
              <MdArrowForward />
            </a>
          )}
        </div>
      </div>

      {/* 2. Grid for Metrics and Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* Metric: Sizing & Savings Card */}
        <div className="glass-card" style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8,24,42,0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', color: 'var(--color-orange)', display: 'flex' }}><MdTrendingUp /></span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Estimated Sizing & Return</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Recommended Sizing</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
                5.8 kWp <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>(12-14 Panels)</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Estimated Monthly Savings</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-blue)', marginTop: '4px' }}>
                ₹4,800 <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>/ month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action: Upcoming Tasks List */}
        <div className="glass-card" style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8,24,42,0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', color: 'var(--color-blue)', display: 'flex' }}><MdOutlineAccessTime /></span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Next Scheduled Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--color-orange)', fontSize: '18px', display: 'flex', marginTop: '2px' }}>👉</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '750' }}>{activeConfig.customerAction.replace('_', ' ')}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Responsible Party: {activeConfig.owner.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', opacity: 0.5 }}>
              <span style={{ color: '#475569', fontSize: '18px', display: 'flex', marginTop: '2px' }}>•</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>Schedule Survey Appointment</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Unlocks during Stage 6 (Proposal Approved)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric: Project Details Overview */}
        <div className="glass-card" style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8,24,42,0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', color: '#36d399', display: 'flex' }}><MdCheckCircle /></span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Rooftop Sizing Metrics</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Available Roof Area</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                ~380 sq ft (South-Facing Ideal)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Utility Discom Group</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                Tata Power Delhi Distribution Limited
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
