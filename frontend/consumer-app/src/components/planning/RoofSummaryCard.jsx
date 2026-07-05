import React from 'react';
import { MdTrendingUp, MdLocationOn, MdGridOn, MdArrowForward, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function RoofSummaryCard({ analysis }) {
  if (!analysis) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Dynamic Recommendation Banner */}
      <div className="glass-card" style={{
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(8, 24, 42, 0.82) 0%, rgba(6, 15, 31, 0.92) 100%)',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{
                background: 'rgba(54, 211, 153, 0.1)',
                border: '1px solid rgba(54, 211, 153, 0.2)',
                color: '#36d399',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase'
              }}>
                Solar Potential: {analysis.solarPotential}
              </span>
              
              <span style={{
                background: analysis.plantFits ? 'rgba(54, 211, 153, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: analysis.plantFits ? '1px solid rgba(54, 211, 153, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)',
                color: analysis.plantFits ? '#36d399' : '#f43f5e',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {analysis.plantFits ? (
                  <>
                    <MdCheckCircle />
                    ✔ 3 kW Plant Fits
                  </>
                ) : (
                  <>
                    <MdCancel />
                    ✖ Roof too small for a 3 kW installation
                  </>
                )}
              </span>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>
              Rooftop Suitability Evaluation
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px' }}>
              Recommended System: <strong>{analysis.recommendedSystem}</strong>. Facing direction is {analysis.facingDirection} ({analysis.compassAngle}°).
            </p>
          </div>

          <a href="/app/planning/proposal" style={{
            background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(255, 138, 29, 0.2)'
          }}>
            Review Proposal
            <MdArrowForward />
          </a>
        </div>
      </div>

      {/* 2. Key Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        {/* Usable Area Card */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '20px', color: 'var(--color-orange)', display: 'flex' }}><MdGridOn /></span>
            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Rooftop Dimensions</h4>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>
            {analysis.roofAreaSqFt} sq ft
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            {analysis.roofLengthFt} ft Length × {analysis.roofWidthFt} ft Width
          </p>
        </div>

        {/* Orientation & Pitch Card */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '20px', color: 'var(--color-blue)', display: 'flex' }}><MdLocationOn /></span>
            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Facing Direction</h4>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>
            {analysis.facingDirection}
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            Compass Angle: {analysis.compassAngle}°
          </p>
        </div>

        {/* Shading Profiles Card */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '20px', color: '#36d399', display: 'flex' }}><MdTrendingUp /></span>
            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Shading & Obstacles</h4>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>
            {analysis.shadingIssues} Shading
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            Obstacles: {analysis.obstacles}
          </p>
        </div>

      </div>

      {/* 3. Detailed Engineering Parameters */}
      <div className="glass-card" style={{
        padding: '25px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        background: 'rgba(8, 24, 42, 0.72)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '850', marginBottom: '20px' }}>Detailed Engineering Analysis</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Location (City)</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>{analysis.location}</div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Roof Condition</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>{analysis.roofCondition}</div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Roof Type</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>{analysis.roofType}</div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Panel Layout</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>
              {analysis.panelRows} rows × {analysis.panelsPerRow} ({analysis.totalPanels} panels)
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Structure Mounting Legs</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>
              {analysis.totalLegs} ({analysis.frontLegs} Front + {analysis.backLegs} Back)
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Front / Back Leg Height</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>
              {analysis.frontLegHeightFt} ft / {analysis.backLegHeightFt} ft
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Estimated Monthly Generation</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>{analysis.monthlyGenerationUnits} Units</div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Estimated Annual Generation</div>
            <div style={{ fontSize: '15px', fontWeight: '750', marginTop: '4px' }}>{analysis.annualGenerationUnits} Units</div>
          </div>

        </div>

        {analysis.analysisNotes && (
          <div style={{
            marginTop: '25px',
            padding: '16px',
            background: 'rgba(255,255,255,0.01)',
            borderLeft: '4px solid var(--color-orange)',
            borderRadius: '0 8px 8px 0',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--text-secondary)'
          }}>
            <strong>Engineering Notes:</strong> {analysis.analysisNotes}
          </div>
        )}
      </div>

    </div>
  );
}
