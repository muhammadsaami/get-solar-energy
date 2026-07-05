import React from 'react';
import { MdCheckCircle } from 'react-icons/md';

export default function BillStatusTimeline({ activeBill }) {
  if (!activeBill) return null;

  const steps = [
    { label: "Uploaded", isDone: true },
    { label: "OCR Processing", isDone: activeBill.ocrStatus === 'Completed' },
    { label: "Verification", isDone: activeBill.verificationStatus === 'Verified' },
    { label: "Analysis", isDone: true }
  ];

  return (
    <div className="glass-card" style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8, 24, 42, 0.72)' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px' }}>Processing Status</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', gap: '20px' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px', position: 'relative' }}>
            {/* Step Line Connector */}
            {idx < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                left: 'calc(50% + 15px)',
                right: 'calc(-50% + 15px)',
                top: '12px',
                height: '2px',
                background: step.isDone && steps[idx + 1].isDone ? 'var(--color-blue)' : 'rgba(255,255,255,0.05)',
                zIndex: 1
              }} />
            )}

            {/* Icon Node */}
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: step.isDone ? 'rgba(23,168,229,0.1)' : 'rgba(255,255,255,0.02)',
              border: step.isDone ? '1.5px solid var(--color-blue)' : '1.5px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step.isDone ? 'var(--color-blue)' : '#475569',
              zIndex: 2,
              marginBottom: '8px'
            }}>
              {step.isDone ? (
                <MdCheckCircle style={{ fontSize: '16px' }} />
              ) : (
                <div style={{ width: '6px', height: '6px', background: '#475569', borderRadius: '50%' }} />
              )}
            </div>

            {/* Label */}
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: step.isDone ? 'var(--text-primary)' : '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
