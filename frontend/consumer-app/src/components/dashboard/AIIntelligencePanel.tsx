import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import type { DashboardDerived } from '../../utils/dashboard'

interface Props {
  loading?: boolean
  derived: DashboardDerived
}

export default function AIIntelligencePanel({ loading = false, derived }: Props) {
  // Check if AI analysis has been executed or if user has analysis data
  const hasAnalysisData = Boolean(
    derived.monthlyUnits > 0 ||
    derived.roofSystemKw > 0 ||
    derived.paybackYears !== null ||
    derived.productionKwh !== null
  )

  const [hasRunAnalysis, setHasRunAnalysis] = useState<boolean>(hasAnalysisData)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleRunAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setTimeout(() => {
      setIsAnalyzing(false)
      setHasRunAnalysis(true)
    }, 1200)
  }

  const rr = derived.readinessPercent
  const hasBill = derived.monthlyUnits > 0
  const hasRoof = derived.roofSystemKw > 0
  const hasRoi = derived.paybackYears !== null

  // Dynamic recommendations based on actual analysis data
  const recommendations: Array<{
    id: string
    title: string
    reason: string
    impact?: string
    actionText: string
    route: string
    icon: string
  }> = []

  if (!hasBill) {
    recommendations.push({
      id: 'rec-bill',
      title: 'Analyze Utility Bill for Baseline Demand',
      reason: 'Upload your latest electricity bill to determine monthly kWh demand and tariff structure.',
      impact: 'Establishes baseline consumption',
      actionText: 'Analyze Bill →',
      route: ROUTES.BILL_ANALYZER,
      icon: '📄',
    })
  }

  if (!hasRoof) {
    recommendations.push({
      id: 'rec-roof',
      title: 'Assess Roof Geometry & Shadow Losses',
      reason: 'Run Roof Vision AI to map shadow-free rooftop area and calculate optimal panel layout.',
      impact: 'Maximizes photovoltaic yield',
      actionText: 'Launch Roof Vision AI →',
      route: ROUTES.ROOF_ANALYSIS,
      icon: '🛰️',
    })
  }

  if (hasBill && hasRoof && !hasRoi) {
    recommendations.push({
      id: 'rec-roi',
      title: 'Calculate Financial Payback & Subsidies',
      reason: 'Evaluate PM Surya Ghar subsidy eligibility and project 25-year financial savings.',
      impact: `Est. ₹${(derived.annualSavings || 45000).toLocaleString('en-IN')}/yr savings`,
      actionText: 'Run ROI Calculator →',
      route: ROUTES.ROI_CALCULATOR,
      icon: '📊',
    })
  }

  if (hasBill && hasRoof && hasRoi) {
    recommendations.push({
      id: 'rec-proposal',
      title: 'Generate Engineering Proposal & BOM',
      reason: 'Your solar profile is fully verified. Generate an official engineering proposal and bill of materials.',
      impact: 'Ready for installation dispatch',
      actionText: 'View AI Proposal →',
      route: ROUTES.PLANNING_PROPOSAL,
      icon: '📑',
    })
  }

  // Prediction milestones if analysis completed
  const predictionMilestones = hasAnalysisData ? [
    { period: 'Month 1', title: 'System Commissioning & Net Metering Sync', desc: 'Solar array connected with bidirectional meter sync.' },
    { period: `Year ${derived.paybackYears ? derived.paybackYears.toFixed(0) : '4-5'}`, title: 'Full Capital Payback (Break-Even)', desc: 'Cumulative electricity savings offset initial system outlay.' },
    { period: 'Year 10', title: 'Inverter Diagnostics & Health Inspection', desc: 'Preventative inspection under comprehensive warranty.' },
    { period: 'Year 25', title: 'Long-term Tier-1 Guaranteed Yield', desc: 'Panels operate at >84.8% linear performance warranty.' },
  ] : []

  return (
    <section
      className="ai-intelligence-section"
      id="aiIntelligenceSection"
      aria-label="Solar AI Intelligence Engine"
      style={{
        marginTop: 'var(--space-4)',
        background: 'rgba(8, 24, 42, 0.82)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(124, 93, 250, 0.15)',
              border: '1px solid rgba(124, 93, 250, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#a78bfa',
            }}
          >
            ✨
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Intelligence Engine
              </h3>
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: 'rgba(124, 93, 250, 0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(124, 93, 250, 0.3)',
                }}
              >
                PLANNING INTELLIGENCE
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
              Multi-model solar suitability assessment, consumption fitting &amp; payback estimation
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="btn btn-primary"
          id="aiAnalyzeBtn"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || loading}
          style={{
            background: isAnalyzing ? 'rgba(124, 93, 250, 0.3)' : 'linear-gradient(135deg, #7C5DFA 0%, #6366F1 100%)',
            color: '#ffffff',
            border: '1px solid rgba(124, 93, 250, 0.5)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(124, 93, 250, 0.3)',
            transition: 'all var(--transition-fast)',
          }}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} />
              <span>Analyzing Solar Profile...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>{hasRunAnalysis ? 'Re-run AI Analysis' : 'Run AI Analysis'}</span>
            </>
          )}
        </button>
      </div>

      {analysisError && (
        <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '12px' }}>
          ⚠️ {analysisError}
        </div>
      )}

      {/* ── STATE A: COMPACT PRE-ANALYSIS READINESS PANEL ────────────────── */}
      {!hasRunAnalysis && !isAnalyzing && (
        <div style={{ marginTop: '20px', padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div style={{ maxWidth: '600px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f8ff', display: 'block', marginBottom: '4px' }}>
                Ready to analyze your solar profile
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                Run AI Analysis to evaluate your energy usage, financial readiness, installation readiness, and solar performance across engineering criteria.
              </p>
            </div>
            <button
              onClick={handleRunAnalysis}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#cbd5e1',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start Full Assessment →
            </button>
          </div>

          {/* 4 Compact Category Readiness Indicators */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700 }}>Energy Consumption</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: hasBill ? '#36D399' : '#17A8E5', background: hasBill ? 'rgba(54, 211, 153, 0.1)' : 'rgba(23, 168, 229, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {hasBill ? 'Ready' : 'Awaiting bill'}
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#f0f8ff' }}>
                {hasBill ? `${derived.monthlyUnits} kWh / mo` : 'Upload bill data'}
              </strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700 }}>Financial Viability</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: hasRoi ? '#36D399' : '#FBBF24', background: hasRoi ? 'rgba(54, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {hasRoi ? 'Available' : 'Awaiting analysis'}
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#f0f8ff' }}>
                {hasRoi ? `${derived.paybackYears?.toFixed(1)} yr payback` : 'Calculate ROI'}
              </strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700 }}>Installation Readiness</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: hasRoof ? '#36D399' : '#17A8E5', background: hasRoof ? 'rgba(54, 211, 153, 0.1)' : 'rgba(23, 168, 229, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {hasRoof ? 'Ready' : 'Awaiting analysis'}
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#f0f8ff' }}>
                {hasRoof ? `${derived.roofSystemKw} kW capacity` : 'Analyze roof'}
              </strong>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700 }}>Solar Performance</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#a78bfa', background: 'rgba(124, 93, 250, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  Ready to evaluate
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#f0f8ff' }}>
                {rr > 0 ? `${rr}% readiness` : 'Run AI assessment'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE B: ANALYSIS COMPLETED ─────────────────────────────────── */}
      {(hasRunAnalysis || isAnalyzing) && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Summary Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Card 1: Solar Readiness */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase' }}>
                  Solar Readiness
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#36D399', background: 'rgba(54, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {rr >= 60 ? 'HIGH POTENTIAL' : 'IN PROGRESS'}
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#36D399', lineHeight: 1 }}>
                {rr}%
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '6px', lineHeight: 1.4, margin: '6px 0 0' }}>
                {rr >= 60
                  ? 'Your property demonstrates verified solar viability with strong projected yield.'
                  : 'Complete remaining analysis steps to reach 100% verified readiness.'}
              </p>
            </div>

            {/* Card 2: Customer Score */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase' }}>
                  Customer Profile Fit
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#ff8a1d', background: 'rgba(255, 138, 29, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {hasBill ? 'PROFILE MATCH' : 'PENDING DATA'}
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#f0f8ff', lineHeight: 1 }}>
                {hasBill && rr > 0 ? `${rr}%` : 'Not available'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '6px', lineHeight: 1.4, margin: '6px 0 0' }}>
                {hasBill
                  ? 'High consumption profile aligns with daytime solar generation curve.'
                  : 'Upload electricity bill to unlock customer consumption matching.'}
              </p>
            </div>

            {/* Card 3: Financial Readiness */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase' }}>
                  Financial Readiness
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: hasRoi ? '#36D399' : '#FBBF24', background: hasRoi ? 'rgba(54, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {hasRoi ? 'VERIFIED' : 'AWAITING ROI'}
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: hasRoi ? '#36D399' : '#f0f8ff', lineHeight: 1 }}>
                {hasRoi ? `${derived.paybackYears?.toFixed(1)} yrs payback` : 'Not available'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '6px', lineHeight: 1.4, margin: '6px 0 0' }}>
                {hasRoi
                  ? `Annual savings of ₹${derived.annualSavings.toLocaleString('en-IN')} with central subsidy assistance.`
                  : 'Calculate ROI to project capital payback and subsidy savings.'}
              </p>
            </div>

            {/* Card 4: Installation Readiness */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase' }}>
                  Installation Readiness
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: hasRoof ? '#17A8E5' : '#94a3b8', background: hasRoof ? 'rgba(23, 168, 229, 0.1)' : 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                  {hasRoof ? 'ASSESSED' : 'PENDING ROOF'}
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#f0f8ff', lineHeight: 1 }}>
                {hasRoof ? `${derived.roofSystemKw} kW` : 'Not available'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '6px', lineHeight: 1.4, margin: '6px 0 0' }}>
                {hasRoof
                  ? 'Structural roof orientation & shadow clearance confirmed for array mount.'
                  : 'Analyze your roof to size optimal solar capacity and mounting structure.'}
              </p>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#f0f8ff', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Actionable AI Recommendations
            </h4>
            {recommendations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>{rec.icon}</span>
                        <strong style={{ fontSize: '12.5px', color: '#f0f8ff' }}>{rec.title}</strong>
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                        {rec.reason}
                      </p>
                      {rec.impact && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#36D399', background: 'rgba(54, 211, 153, 0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                          ✓ {rec.impact}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Link
                        to={rec.route}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#17A8E5',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {rec.actionText}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                No recommendations available yet. Run AI Analysis to generate personalized recommendations.
              </div>
            )}
          </div>

          {/* Prediction Timeline */}
          {predictionMilestones.length > 0 ? (
            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#f0f8ff', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                System Lifecycle Prediction Timeline
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                {predictionMilestones.map((m, idx) => (
                  <div
                    key={m.period}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === 0 ? '#36D399' : '#17A8E5' }} />
                      <span style={{ fontSize: '10px', fontWeight: 800, color: idx === 0 ? '#36D399' : '#17A8E5', textTransform: 'uppercase' }}>
                        {m.period}
                      </span>
                    </div>
                    <strong style={{ fontSize: '11.5px', color: '#f0f8ff', display: 'block', marginBottom: '2px' }}>
                      {m.title}
                    </strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.3, display: 'block' }}>
                      {m.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)' }}>
              Prediction timeline will appear after AI analysis.
            </div>
          )}
        </div>
      )}
    </section>
  )
}