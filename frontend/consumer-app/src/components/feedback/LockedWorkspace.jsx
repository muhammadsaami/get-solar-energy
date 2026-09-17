import React from 'react';
import { Link } from 'react-router-dom';
import { useJourney } from '../../contexts/JourneyContext';
import { JOURNEY_CONFIG } from '../../constants/journey.config';

export default function LockedWorkspace({ targetStageId, featureTitle }) {
  const { currentStageId } = useJourney();
  const targetConfig = JOURNEY_CONFIG[targetStageId] || JOURNEY_CONFIG['ST-02'];
  const currentConfig = JOURNEY_CONFIG[currentStageId] || JOURNEY_CONFIG['ST-01'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 40px',
      background: 'rgba(8, 24, 42, 0.72)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      maxWidth: '600px',
      margin: '60px auto',
      textAlign: 'center',
      boxShadow: '0 24px 80px rgba(0,0,0,0.25)'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        background: 'rgba(255, 138, 29, 0.08)',
        width: '90px',
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        color: 'var(--color-orange)',
        border: '1px solid rgba(255, 138, 29, 0.15)'
      }}>
        🔒
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
        {featureTitle || 'Workspace Locked'}
      </h2>
      {featureTitle && (
        <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Workspace Locked
        </p>
      )}
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '30px', maxWidth: '460px' }}>
        This page will become available once your journey reaches the <strong>{targetConfig.displayName}</strong> phase.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px 24px',
        width: '100%',
        marginBottom: '30px',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '700' }}>
          Current Status
        </div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-blue)' }}>
          {currentConfig.displayName} ({currentConfig.progressWeight}% Complete)
        </div>
      </div>

      <Link to="/app/journey" style={{
        background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
        color: 'white',
        textDecoration: 'none',
        padding: '14px 28px',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '15px',
        boxShadow: '0 8px 30px rgba(255, 138, 29, 0.25)',
        transition: 'all var(--duration-fast) var(--ease-standard)'
      }}>
        View Journey Roadmap
      </Link>
    </div>
  );
}
