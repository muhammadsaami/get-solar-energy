import React from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, safeValue } from '../../services/pdf/proposalPdfGenerator';

/**
 * True Document Preview Component for GET Solar Energy Proposals.
 * Renders a genuine, selectable HTML document with light A4 paper styling,
 * structured tables, official branding, and authorization blocks.
 */
export default function ProposalPreview({
  form = {},
  insights = {},
  proposal = null,
  version = 'v1.0',
  onClose = () => {},
  onExportPdf = () => {},
  isExportingPdf = false,
}) {
  const proposalId = proposal?.id || proposal?.proposal_id || `GSE-PROP-${Date.now().toString().slice(-6)}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const customerName = form.customerName || 'Valued Homeowner';
  const customerCity = form.city || 'your region';
  const kwSize = insights.kw ? `${insights.kw} kWp` : (form.recommendedKw ? `${form.recommendedKw} kWp` : '—');
  const billAmount = form.monthlyBill ? `₹${parseFloat(form.monthlyBill).toLocaleString('en-IN')}` : '—';
  const annualKwh = insights.annualGen ? `${Math.round(insights.annualGen).toLocaleString('en-IN')} kWh` : '—';
  const subsidyAmount = formatCurrency(insights.subsidy);
  const netOutlay = formatCurrency(insights.netCost);

  const hasData = Boolean(insights.kw || form.customerName || form.monthlyBill);

  const monthlyCurveData = insights.monthlyCurve || [
    { month: 'Jan', gen: 428, savings: 3420 },
    { month: 'Feb', gen: 473, savings: 3780 },
    { month: 'Mar', gen: 540, savings: 4320 },
    { month: 'Apr', gen: 563, savings: 4500 },
    { month: 'May', gen: 585, savings: 4680 },
    { month: 'Jun', gen: 495, savings: 3960 },
    { month: 'Jul', gen: 338, savings: 2700 },
    { month: 'Aug', gen: 315, savings: 2520 },
    { month: 'Sep', gen: 383, savings: 3060 },
    { month: 'Oct', gen: 473, savings: 3780 },
    { month: 'Nov', gen: 428, savings: 3420 },
    { month: 'Dec', gen: 405, savings: 3240 },
  ];

  const content = (
    <div
      className="proposal-preview-backdrop backdrop-animate-in"
      id="proposalPreviewModal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.95)',
        backdropFilter: 'blur(16px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── PREVIEW TOOLBAR (OUTSIDE DOCUMENT) ────────────────────────── */}
      <div
        className="proposal-preview-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#060F1F',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            id="closePreviewBtn"
            style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Proposal Builder
          </button>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
            Proposal Document Preview
          </span>
          <span className="badge badge-info badge-sm" style={{ fontSize: '10px' }}>
            {proposalId}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            id="exportPdfFromPreviewBtn"
            style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isExportingPdf ? '⏳ Generating PDF...' : '📄 Export Proposal PDF'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ fontSize: '16px', lineHeight: 1, padding: '4px 10px', color: 'var(--text-muted)' }}
            title="Close Preview"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE DOCUMENT WORKSPACE ────────────────────────────── */}
      <div
        className="proposal-preview-workspace"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 16px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* ── PAGE 1: COVER, EXECUTIVE SUMMARY & SPECS ────────────────── */}
        <div
          className="proposal-document-sheet"
          id="proposalPage1"
          style={{
            width: '100%',
            maxWidth: '820px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderRadius: '4px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
            padding: '40px',
            boxSizing: 'border-box',
            fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              backgroundColor: '#060F1F',
              borderRadius: '6px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src="/assets/logo.png"
                alt="GET SOLAR ENERGY"
                style={{ height: '36px', width: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF8A1D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI-Optimized Solar Proposal
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                ID: {proposalId} | {currentDate}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                Version: {version}
              </div>
            </div>
          </div>

          {!hasData ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '8px' }}>Proposal data is not available yet</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>
                Complete the required planning and calculation steps in the proposal builder to generate a personalized proposal document.
              </p>
            </div>
          ) : (
            <>
              {/* Executive Summary */}
              <div style={{ marginBottom: '22px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0A2540', marginBottom: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px' }}>
                  Executive Summary
                </h2>
                <p style={{ fontSize: '12.5px', lineHeight: 1.65, color: '#334155', margin: 0 }}>
                  This customized engineering proposal has been developed for <strong>{customerName}</strong> located in <strong>{customerCity}</strong>. Based on your monthly grid electricity expenditure of <strong>{billAmount}</strong> ({safeValue(form.monthlyUnits, ' kWh')}), we recommend an optimized <strong>{kwSize} On-Grid Rooftop Solar Power Plant</strong>. Under standard meteorological conditions, the proposed system is estimated to generate approximately <strong>{annualKwh}</strong> of clean electricity annually. Under the Ministry of New and Renewable Energy (MNRE) <strong>PM Surya Ghar: Muft Bijli Yojana</strong>, this installation qualifies for an upfront direct government subsidy of <strong>{subsidyAmount}</strong>, resulting in a net customer investment outlay of <strong>{netOutlay}</strong>.
                </p>
              </div>

              {/* KPI Highlights Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  marginBottom: '24px',
                }}
              >
                {[
                  { label: 'Recommended System', val: kwSize, sub: `${safeValue(insights.panels, ' Panels')}`, color: '#17A8E5' },
                  { label: 'PM Surya Ghar Subsidy', val: subsidyAmount, sub: 'Direct Govt Benefit', color: '#10B981' },
                  { label: 'Net Capital Outlay', val: netOutlay, sub: 'After MNRE Subsidy', color: '#FF8A1D' },
                  { label: 'Estimated Payback', val: safeValue(insights.payback, ' Yrs'), sub: `Life: ${formatCurrency(insights.lifetimeSavings)}`, color: '#17A8E5' },
                ].map((k, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: k.color, lineHeight: 1.2 }}>
                      {k.val}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '3px' }}>
                      {k.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 1: Customer & Site Specifications */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '8px' }}>
                  1. Customer &amp; Site Specifications
                </h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11.5px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <tbody>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, width: '25%', border: '1px solid #e2e8f0' }}>Customer Name</td>
                      <td style={{ padding: '6px 10px', width: '25%', border: '1px solid #e2e8f0' }}>{safeValue(form.customerName)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, width: '25%', border: '1px solid #e2e8f0' }}>Phone Number</td>
                      <td style={{ padding: '6px 10px', width: '25%', border: '1px solid #e2e8f0' }}>{safeValue(form.phone)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Email Address</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{safeValue(form.email)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Installation City</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{safeValue(form.city)}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Site Address</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{safeValue(form.address)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Usable Roof Area</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{safeValue(form.roofArea, ' sq ft')}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>6-Mo Avg Monthly Bill</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{formatCurrency(form.monthlyBill || insights.avgMonthlyBill)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Peak Consumption Month</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>
                        {insights.highestConsumptionMonth ? `${insights.highestConsumptionMonth.month} (${insights.highestConsumptionMonth.units} kWh)` : safeValue(form.monthlyUnits, ' kWh')}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Grid Tariff Rate</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{safeValue(form.electricityRate ? `₹${form.electricityRate}/kWh` : null)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>DISCOM Meter Sync</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>Bi-Directional Smart Net Meter</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Technical Bill of Materials (BOM) */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '8px' }}>
                  2. Technical Bill of Materials (BOM) &amp; Equipment Specifications
                </h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11.5px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', width: '26%' }}>Equipment Category</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', width: '40%' }}>Technical Specification</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', width: '14%' }}>Quantity</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', width: '20%' }}>Warranty Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Solar PV Modules</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{form.panelType || '540W Mono PERC Tier-1'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#17A8E5', border: '1px solid #e2e8f0' }}>{safeValue(insights.panels, ' Units')}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>25-Year Performance (84.8%)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>On-Grid Solar Inverter</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{form.inverterType || '5 kW 3-Phase MPPT String Inverter'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#17A8E5', border: '1px solid #e2e8f0' }}>1 Unit</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>10-Year Replacement Warranty</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Rooftop Mounting Structure</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>Hot-Dip Galvanized Iron (HDG) Structure (150 km/h wind rated)</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#17A8E5', border: '1px solid #e2e8f0' }}>1 Complete Set</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>15-Year Structural Warranty</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>AC/DC Protection &amp; SPDs</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>IP65 Enclosure with Type-2 Surge Protection (SPD), DC Isolator &amp; MCBs</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#17A8E5', border: '1px solid #e2e8f0' }}>2 Sets (AC + DC)</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>5-Year Component Warranty</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Bi-Directional Net Meter</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>DISCOM-Approved Smart Bi-Directional Dual-Tariff Meter</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#17A8E5', border: '1px solid #e2e8f0' }}>1 Unit</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>5-Year Utility Compliance</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Battery Backup Option</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{form.batteryOption || 'None (Grid-Tied Net Metering)'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>N/A</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>N/A (Grid Synchronized)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Running Footer Page 1 */}
              <div
                style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9.5px',
                  color: '#94a3b8',
                }}
              >
                <span>GET SOLAR ENERGY • INDIA&apos;S SOLAR INTELLIGENCE &amp; SERVICE ECOSYSTEM</span>
                <span>Page 1 of 2</span>
              </div>
            </>
          )}
        </div>

        {/* ── PAGE 2: FINANCIALS, GENERATION, EXECUTION & SIGNATURES ──── */}
        {hasData && (
          <div
            className="proposal-document-sheet"
            id="proposalPage2"
            style={{
              width: '100%',
              maxWidth: '820px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '4px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
              padding: '40px',
              boxSizing: 'border-box',
              fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              position: 'relative',
            }}
          >
            {/* Running Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#94a3b8',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '6px',
                marginBottom: '20px',
              }}
            >
              <span>GET SOLAR ENERGY | AI-Optimized Solar Engineering Proposal</span>
              <span>Proposal ID: {proposalId}</span>
            </div>

            {/* Section 3: Financial Breakdown */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '8px' }}>
                3. Financial Breakdown &amp; PM Surya Ghar Subsidy Schedule
              </h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11.5px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', width: '38%' }}>Financial Parameter</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', width: '20%' }}>Amount / Value</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', width: '42%' }}>Benchmark Reference &amp; Policy Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Estimated Gross Turnkey Cost</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0A2540', border: '1px solid #e2e8f0' }}>{formatCurrency(insights.systemCost)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>Includes Tier-1 Hardware, Mounting, Civil Work &amp; Commissioning</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>PM Surya Ghar: Muft Bijli Subsidy</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#10B981', border: '1px solid #e2e8f0' }}>- {formatCurrency(insights.subsidy)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>Direct DBT subsidy credited to customer bank account post-inspection</td>
                  </tr>
                  <tr style={{ backgroundColor: '#fff7ed' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 800, color: '#c2410c', border: '1px solid #e2e8f0' }}>Net Customer Investment Outlay</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 900, color: '#ea580c', border: '1px solid #e2e8f0' }}>{formatCurrency(insights.netCost)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#9a3412', border: '1px solid #e2e8f0' }}>Effective net capital expenditure after direct government subsidy</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Estimated Monthly Electricity Savings</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#10B981', border: '1px solid #e2e8f0' }}>{formatCurrency(insights.monthlySavings)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>Based on average monthly generation offset against local grid tariff</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Estimated Annual Electricity Savings</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#10B981', border: '1px solid #e2e8f0' }}>{formatCurrency(insights.annualSavings)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>Annual financial savings from self-consumption &amp; export</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>Estimated Payback Period</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#17A8E5', border: '1px solid #e2e8f0' }}>{safeValue(insights.payback, ' Years')}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>Estimated duration to recover initial net capital investment</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>25-Year Cumulative Net Savings</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#17A8E5', border: '1px solid #e2e8f0' }}>{formatCurrency(insights.lifetimeSavings)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>Net financial yield over 25 operational years accounting for degradation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: 12-Month Generation & Environmental Impact */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '8px' }}>
                4. Simulated 12-Month Generation &amp; Environmental Impact
              </h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'center' }}>Month</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Est. Gen (kWh)</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Est. Savings</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center' }}>Month</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Est. Gen (kWh)</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Est. Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5].map(i => {
                    const l = monthlyCurveData[i];
                    const r = monthlyCurveData[i + 6];
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #e2e8f0' }}>{l?.month}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #e2e8f0' }}>{safeValue(l?.gen, ' kWh')}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#10B981', border: '1px solid #e2e8f0' }}>{formatCurrency(l?.savings)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #e2e8f0' }}>{r?.month}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #e2e8f0' }}>{safeValue(r?.gen, ' kWh')}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#10B981', border: '1px solid #e2e8f0' }}>{formatCurrency(r?.savings)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                }}
              >
                <strong style={{ color: '#10B981', textTransform: 'uppercase', fontSize: '10px' }}>ENVIRONMENTAL IMPACT:</strong>
                <span style={{ color: '#334155' }}>
                  Annual Carbon Reduction: <strong>{safeValue(insights.co2, ' Metric Tons CO2')}</strong> | Equivalent to planting <strong>{safeValue(insights.trees, ' Trees/Year')}</strong>
                </span>
              </div>
            </div>

            {/* Section 5: Turnkey Execution Timeline */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '8px' }}>
                5. Turnkey Project Execution &amp; Milestone Timeline
              </h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', width: '15%' }}>Stage</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', width: '45%' }}>Milestone Description</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', width: '18%' }}>Estimated Timeline</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', width: '22%' }}>Standard Deliverable</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stage: 'Stage 1', desc: 'Engineering Site Assessment & 3D Shadow Analysis', days: 'Days 1 – 2', del: 'CAD Layout Sanction' },
                    { stage: 'Stage 2', desc: 'DISCOM Net-Metering Application & Approvals', days: 'Days 3 – 5', del: 'Utility Feasibility Sanction' },
                    { stage: 'Stage 3', desc: 'Procurement & Hardware Dispatch to Site', days: 'Days 6 – 8', del: 'Tier-1 Module Dispatch' },
                    { stage: 'Stage 4', desc: 'Mounting, Mechanical Assembly & AC/DC Cabling', days: 'Days 9 – 10', del: 'IS 732 Safety Integration' },
                    { stage: 'Stage 5', desc: 'Pre-Commissioning Quality & Safety Inspection', days: 'Day 11', del: 'String QA Testing Stamp' },
                    { stage: 'Stage 6', desc: 'Net-Meter Installation, Grid Sync & Handover', days: 'Days 12 – 14', del: 'Commissioning Certificate' },
                  ].map((s, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #e2e8f0' }}>{s.stage}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.desc}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700, color: '#17A8E5', border: '1px solid #e2e8f0' }}>{s.days}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.del}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 6: Commercial Terms */}
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '6px' }}>
                6. Commercial Terms &amp; Standard Assumptions
              </h3>
              <ul style={{ fontSize: '10.5px', color: '#475569', margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                <li>System performance estimations assume unshaded rooftop conditions with orientation aligned to local optimal azimuth.</li>
                <li>Solar PV panels include a 10-year product warranty and 25-year linear performance warranty guaranteeing &gt;= 84.8% output.</li>
                <li>Government subsidy disbursement is subject to MNRE national portal guidelines and local DISCOM inspection compliance.</li>
                <li>Milestone payment terms: 10% on proposal approval, 70% upon equipment dispatch, 20% post-commissioning net-meter sync.</li>
              </ul>
            </div>

            {/* Section 7: Authorization & Signatures */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0A2540', marginBottom: '8px' }}>
                7. Authorization &amp; Proposal Acceptance
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#0A2540', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Customer Acceptance
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155', marginBottom: '14px' }}>
                    Customer Name: <strong>{customerName}</strong>
                  </div>
                  <div style={{ borderBottom: '1px dashed #94a3b8', height: '24px', marginBottom: '6px' }} />
                  <div style={{ fontSize: '9.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Signature</span>
                    <span>Date: {currentDate}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#0A2540', textTransform: 'uppercase', marginBottom: '8px' }}>
                    GET Solar Energy Representative
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155', marginBottom: '14px' }}>
                    Authorized Engineer: <strong>Senior Technical Advisor</strong>
                  </div>
                  <div style={{ borderBottom: '1px dashed #94a3b8', height: '24px', marginBottom: '6px' }} />
                  <div style={{ fontSize: '9.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Signature</span>
                    <span>Date: {currentDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Running Footer Page 2 */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9.5px',
                color: '#94a3b8',
              }}
            >
              <span>GET SOLAR ENERGY • INDIA&apos;S SOLAR INTELLIGENCE &amp; SERVICE ECOSYSTEM</span>
              <span>Page 2 of 2</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
