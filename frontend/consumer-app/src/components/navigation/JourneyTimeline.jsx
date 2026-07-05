import React from 'react';
import { useJourney } from '../../contexts/JourneyContext';
import { MdCheckCircle, MdLock } from 'react-icons/md';

export default function JourneyTimeline() {
  const { currentStageId, journeyTimeline } = useJourney();

  const currentIndex = journeyTimeline.findIndex(stage => stage.id === currentStageId);

  return (
    <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8, 24, 42, 0.72)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>Solar Installation Pipeline</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {journeyTimeline.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = stage.id === currentStageId;
          const isLocked = idx > currentIndex;

          return (
            <div key={stage.id} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
              {/* Vertical connector line */}
              {idx < journeyTimeline.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '15px',
                  top: '32px',
                  bottom: '-20px',
                  width: '2px',
                  background: isCompleted ? 'var(--color-blue)' : 'rgba(255,255,255,0.05)',
                  zIndex: 1
                }} />
              )}

              {/* Step indicator node */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isActive 
                  ? 'rgba(255,138,29,0.15)' 
                  : isCompleted 
                    ? 'rgba(23,168,229,0.1)' 
                    : 'rgba(255,255,255,0.02)',
                border: isActive 
                  ? '2px solid var(--color-orange)' 
                  : isCompleted 
                    ? '1.5px solid var(--color-blue)' 
                    : '1.5px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                color: isActive 
                  ? 'var(--color-orange)' 
                  : isCompleted 
                    ? 'var(--color-blue)' 
                    : '#475569'
              }}>
                {isCompleted ? (
                  <MdCheckCircle style={{ fontSize: '20px' }} />
                ) : isLocked ? (
                  <MdLock style={{ fontSize: '14px' }} />
                ) : (
                  <span className="pulse-dot green" style={{ width: '8px', height: '8px', background: '#36d399', borderRadius: '50%' }} />
                )}
              </div>

              {/* Stage content details */}
              <div style={{ flex: 1, paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    margin: 0,
                    color: isActive 
                      ? 'var(--text-primary)' 
                      : isCompleted 
                        ? 'var(--text-secondary)' 
                        : '#475569'
                  }}>
                    {stage.displayName}
                  </h4>
                  {isActive && (
                    <span style={{
                      background: 'rgba(54, 211, 153, 0.1)',
                      border: '1px solid rgba(54, 211, 153, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      color: '#36d399',
                      fontWeight: '800',
                      textTransform: 'uppercase'
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '13px',
                  color: isLocked ? '#334155' : 'var(--text-secondary)',
                  margin: '4px 0 0 0',
                  lineHeight: '1.5'
                }}>
                  {stage.description}
                </p>
                {isActive && stage.customerAction !== 'NONE' && (
                  <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-orange)' }}>
                      👉 Action Required: {stage.customerAction.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
