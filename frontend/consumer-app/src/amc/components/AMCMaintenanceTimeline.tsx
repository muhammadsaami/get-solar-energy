import React from 'react'

interface AMCMaintenanceTimelineProps {
  currentStep: number
  onStepClick?: (step: number) => void
}

const STEPS = [
  { step: 1, title: 'Inspection', desc: 'Physical & thermal scans' },
  { step: 2, title: 'Cleaning', desc: 'High-pressure washing' },
  { step: 3, title: 'Electrical Check', desc: 'Wiring & terminal torque' },
  { step: 4, title: 'Performance Testing', desc: 'I-V curve & inverter stats' },
  { step: 5, title: 'Preventive Maint.', desc: 'Calibration & safety test' },
  { step: 6, title: 'Annual Report', desc: 'Production & ROI summary' },
]

function AMCMaintenanceTimelineComponent({ currentStep, onStepClick }: AMCMaintenanceTimelineProps) {
  const progressPercent = Math.min(100, Math.round((currentStep / 6) * 100))

  return (
    <>
      <style>{`
        .amc-timeline-card {
          margin-bottom: 20px;
          padding: 16px 24px;
        }
        .amc-timeline-wrapper {
          position: relative;
          margin: 12px 0 8px 0;
          padding: 10px 0;
          width: 100%;
        }
        .amc-timeline-progress {
          position: absolute;
          top: 32px;
          left: 6%;
          right: 6%;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          z-index: 1;
        }
        .amc-timeline-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
          box-shadow: 0 0 10px rgba(23, 168, 229, 0.4);
        }
        .amc-timeline-steps {
          position: relative;
          display: flex;
          justify-content: space-between;
          z-index: 2;
          width: 100%;
        }
        .amc-timeline-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 15%;
          text-align: center;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        .amc-timeline-step:hover {
          transform: translateY(-2px);
        }
        .amc-step-badge {
          position: absolute;
          top: -6px;
          right: 20%;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          transition: all 0.25s ease;
        }
        .amc-step-icon-container {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(14, 34, 53, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
          margin-bottom: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .amc-step-icon {
          width: 18px;
          height: 18px;
        }
        .amc-step-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }
        .amc-step-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          transition: color 0.35s ease;
        }
        .amc-step-desc {
          font-size: 9px;
          color: rgba(159, 179, 200, 0.5);
          max-width: 110px;
          line-height: 1.2;
          transition: color 0.35s ease;
        }

        .amc-timeline-step.completed .amc-step-icon-container {
          background: rgba(54, 211, 153, 0.12);
          border-color: rgba(54, 211, 153, 0.4);
          color: var(--accent-green);
          box-shadow: 0 0 12px rgba(54, 211, 153, 0.2);
        }
        .amc-timeline-step.completed .amc-step-badge {
          background: var(--accent-green);
          border-color: var(--accent-green);
          color: #ffffff;
        }
        .amc-timeline-step.completed .amc-step-title {
          color: var(--text-navy);
        }

        .amc-timeline-step.current .amc-step-icon-container {
          background: rgba(23, 168, 229, 0.15);
          border-color: rgba(23, 168, 229, 0.6);
          color: var(--accent-blue);
          box-shadow: 0 0 12px rgba(23, 168, 229, 0.35);
        }
        .amc-timeline-step.current .amc-step-badge {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
          color: #ffffff;
        }
        .amc-timeline-step.current .amc-step-title {
          color: #ffffff;
        }

        .amc-timeline-step.future .amc-step-icon-container {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.2);
        }
        .amc-timeline-step.future .amc-step-badge {
          background: var(--bg-card);
          border-color: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.3);
        }
        .amc-timeline-step.future .amc-step-title {
          color: rgba(159, 179, 200, 0.4);
        }

        .amc-timeline-step:hover .amc-step-icon-container {
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 820px) {
          .amc-timeline-wrapper {
            padding: 0 0 0 20px;
            margin: 10px 0;
          }
          .amc-timeline-progress {
            top: 5%;
            bottom: 5%;
            left: 21px;
            width: 4px;
            height: 90%;
            right: auto;
          }
          .amc-timeline-progress-bar {
            width: 100% !important;
            height: 16.6%;
          }
          .amc-timeline-steps {
            flex-direction: column;
            gap: 14px;
            align-items: flex-start;
          }
          .amc-timeline-step {
            flex-direction: row;
            align-items: center;
            width: 100%;
            text-align: left;
            gap: 15px;
          }
          .amc-timeline-step:hover {
            transform: translateX(3px);
          }
          .amc-step-badge {
            left: 36px;
            top: -4px;
            right: auto;
          }
          .amc-step-icon-container {
            margin-bottom: 0;
            flex-shrink: 0;
          }
          .amc-step-meta {
            align-items: flex-start;
            text-align: left;
          }
        }

        @media (max-width: 900px) {
          .amc-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="card-base amc-timeline-card" style={{ '--card-theme': '0, 174, 239' } as React.CSSProperties}>
        <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color-light)', paddingBottom: '8px', marginBottom: '12px' }}>
          <span className="kpi-title" style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Visual Maintenance & Inspection Lifecycle
          </span>
        </div>
        <div className="amc-timeline-wrapper">
          <div className="amc-timeline-progress">
            <div className="amc-timeline-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="amc-timeline-steps">
            {STEPS.map(({ step, title, desc }) => {
              let stateClass = 'future'
              if (step < currentStep) stateClass = 'completed'
              else if (step === currentStep) stateClass = 'active current'
              return (
                <div
                  key={step}
                  className={`amc-timeline-step ${stateClass}`}
                  onClick={() => onStepClick?.(step)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${title}: ${desc}`}
                  aria-current={step === currentStep ? 'step' : undefined}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStepClick?.(step) } }}
                >
                  <div className="amc-step-badge">{step}</div>
                  <div className="amc-step-icon-container">
                    <svg className="amc-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {step === 1 && <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>}
                      {step === 2 && <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />}
                      {step === 3 && <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />}
                      {step === 4 && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />}
                      {step === 5 && <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />}
                      {step === 6 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>}
                    </svg>
                  </div>
                  <div className="amc-step-meta">
                    <span className="amc-step-title">{title}</span>
                    <span className="amc-step-desc">{desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export const AMCMaintenanceTimeline = React.memo(AMCMaintenanceTimelineComponent)
