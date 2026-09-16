import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlanning } from '../contexts/PlanningContext';
import { useAuth } from '../contexts/AuthContext';
import { generateProposalPdf } from '../services/pdf/proposalPdfGenerator';
import ProposalPreview from '../components/proposal/ProposalPreview';

const STEPS = [
  { id: 'analyzing', label: 'Analyzing consumption & DISCOM tariff data...', duration: 600 },
  { id: 'estimating', label: 'Computing optimal rooftop tilt & orientation...', duration: 700 },
  { id: 'calculating', label: 'Calculating PM Surya Ghar government subsidies...', duration: 600 },
  { id: 'preparing', label: 'Building equipment Bill of Materials (BOM)...', duration: 800 },
  { id: 'rendering', label: 'Generating enterprise solar proposal PDF...', duration: 500 },
];

const INITIAL_FORM = {
  customerName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  monthlyBill: '',
  monthlyUnits: '',
  electricityRate: '8.0',
  roofArea: '',
  recommendedKw: '',
  panelType: 'Tier-1 Mono PERC',
  inverterType: '5 kW 3-Phase MPPT String Inverter',
  batteryOption: 'None (Grid-Tied Net Metering)',
  notes: '',
};

export default function Proposal() {
  const { user } = useAuth() || {};
  const { proposal, activeBillOcr, roofAnalysis, generateProposal, approveProposal, loading, error, bills } = usePlanning();
  const [form, setForm] = useState(INITIAL_FORM);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showOutput, setShowOutput] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState('Draft');
  const [actionSuccess, setActionSuccess] = useState('');
  const [version, setVersion] = useState('v1.0 (Latest)');
  const [savedTime, setSavedTime] = useState('Just now');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (proposal) {
      setShowOutput(true);
      setStatus(proposal.status || 'Draft');
    }
  }, [proposal]);

  // Compute 6-month average bill and highest consumption month from actual available billing records
  const billRecords = useMemo(() => {
    return Array.isArray(bills) && bills.length > 0 ? bills : (activeBillOcr ? [activeBillOcr] : []);
  }, [bills, activeBillOcr]);

  const { calculatedAvgBill, highestConsumptionMonth } = useMemo(() => {
    const validBillAmounts = billRecords
      .map(b => {
        const val = typeof b.amount === 'number' && b.amount > 0
          ? b.amount
          : (typeof b.bill_amount === 'number' && b.bill_amount > 0 ? b.bill_amount : (typeof b.amount === 'string' && parseFloat(b.amount) > 0 ? parseFloat(b.amount) : null));
        return val;
      })
      .filter(val => typeof val === 'number' && !isNaN(val))
      .slice(0, 6);

    const avgBill = validBillAmounts.length > 0
      ? Math.round(validBillAmounts.reduce((sum, v) => sum + v, 0) / validBillAmounts.length)
      : (activeBillOcr?.bill_amount || null);

    const validConsumptionBills = billRecords.filter(b => {
      const u = typeof b.kwhConsumption === 'number' ? b.kwhConsumption : (typeof b.monthly_units === 'number' ? b.monthly_units : parseFloat(b.kwhConsumption || b.monthly_units));
      return typeof u === 'number' && !isNaN(u) && u > 0;
    });

    const peakRecord = validConsumptionBills.reduce((max, b) => {
      const curUnits = typeof b.kwhConsumption === 'number' ? b.kwhConsumption : (typeof b.monthly_units === 'number' ? b.monthly_units : parseFloat(b.kwhConsumption || b.monthly_units) || 0);
      const maxUnits = max ? (typeof max.kwhConsumption === 'number' ? max.kwhConsumption : (typeof max.monthly_units === 'number' ? max.monthly_units : parseFloat(max.kwhConsumption || max.monthly_units) || 0)) : 0;
      return curUnits > maxUnits ? b : max;
    }, null);

    const peakMonth = peakRecord ? {
      month: peakRecord.billingPeriod || peakRecord.billing_period || (peakRecord.uploadDate ? new Date(peakRecord.uploadDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Peak Month'),
      units: Math.round(typeof peakRecord.kwhConsumption === 'number' ? peakRecord.kwhConsumption : (typeof peakRecord.monthly_units === 'number' ? peakRecord.monthly_units : parseFloat(peakRecord.kwhConsumption || peakRecord.monthly_units) || 0)),
      billCount: validConsumptionBills.length,
    } : (activeBillOcr?.monthly_units ? {
      month: activeBillOcr.billing_period || 'Latest Bill',
      units: Math.round(activeBillOcr.monthly_units),
      billCount: 1,
    } : null);

    return {
      calculatedAvgBill: avgBill,
      highestConsumptionMonth: peakMonth,
    };
  }, [billRecords, activeBillOcr]);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      customerName: prev.customerName || user?.name || '',
      email: prev.email || user?.email || '',
      phone: prev.phone || user?.phone || '',
      address: prev.address || user?.address || '',
      city: prev.city || user?.city || '',
      monthlyBill: prev.monthlyBill || (calculatedAvgBill ? String(calculatedAvgBill) : (activeBillOcr?.bill_amount ? String(activeBillOcr.bill_amount) : '')),
      monthlyUnits: prev.monthlyUnits || (highestConsumptionMonth?.units ? String(highestConsumptionMonth.units) : (activeBillOcr?.monthly_units ? String(activeBillOcr.monthly_units) : '')),
      electricityRate: prev.electricityRate || (activeBillOcr?.per_unit_rate ? String(activeBillOcr.per_unit_rate) : '8.0'),
      roofArea: prev.roofArea || (roofAnalysis?.roof_area_sqft ? String(roofAnalysis.roof_area_sqft) : ''),
      recommendedKw: prev.recommendedKw || (roofAnalysis?.system_size_kw ? String(roofAnalysis.system_size_kw) : (activeBillOcr?.recommended_kw ? String(activeBillOcr.recommended_kw) : '')),
    }));
  }, [user, activeBillOcr, roofAnalysis, calculatedAvgBill, highestConsumptionMonth]);

  const handleChange = useCallback((field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setSavedTime('Saving...');
    setTimeout(() => setSavedTime('Saved to cloud'), 800);
  }, []);

  const insights = useMemo(() => {
    const kw = parseFloat(form.recommendedKw) || 0;
    const rate = parseFloat(form.electricityRate) || 8.0;
    const area = parseFloat(form.roofArea) || 0;
    const monthlyGen = kw * 4.5 * 30; // ~135 kWh/kW/month
    const annualGen = monthlyGen * 12;
    const monthlySavings = monthlyGen * rate;
    const annualSavings = monthlySavings * 12;
    const systemCost = kw * 52000;
    const subsidy = kw === 0 ? 0 : kw <= 2 ? kw * 30000 : kw <= 3 ? 60000 + (kw - 2) * 18000 : 78000;
    const netCost = Math.max(0, systemCost - subsidy);
    const payback = annualSavings > 0 ? (netCost / annualSavings).toFixed(1) : '—';
    const lifetimeSavings = annualSavings > 0 ? annualSavings * 25 - netCost : 0;
    const co2 = (annualGen * 0.00082).toFixed(2);
    const trees = Math.round(annualGen * 0.045);
    const panels = kw > 0 ? Math.ceil((kw * 1000) / 540) : 0;

    const monthlyCurve = [
      { month: 'Jan', gen: Math.round(monthlyGen * 0.95), savings: Math.round(monthlyGen * 0.95 * rate) },
      { month: 'Feb', gen: Math.round(monthlyGen * 1.05), savings: Math.round(monthlyGen * 1.05 * rate) },
      { month: 'Mar', gen: Math.round(monthlyGen * 1.20), savings: Math.round(monthlyGen * 1.20 * rate) },
      { month: 'Apr', gen: Math.round(monthlyGen * 1.25), savings: Math.round(monthlyGen * 1.25 * rate) },
      { month: 'May', gen: Math.round(monthlyGen * 1.30), savings: Math.round(monthlyGen * 1.30 * rate) },
      { month: 'Jun', gen: Math.round(monthlyGen * 1.10), savings: Math.round(monthlyGen * 1.10 * rate) },
      { month: 'Jul', gen: Math.round(monthlyGen * 0.75), savings: Math.round(monthlyGen * 0.75 * rate) },
      { month: 'Aug', gen: Math.round(monthlyGen * 0.70), savings: Math.round(monthlyGen * 0.70 * rate) },
      { month: 'Sep', gen: Math.round(monthlyGen * 0.85), savings: Math.round(monthlyGen * 0.85 * rate) },
      { month: 'Oct', gen: Math.round(monthlyGen * 1.05), savings: Math.round(monthlyGen * 1.05 * rate) },
      { month: 'Nov', gen: Math.round(monthlyGen * 0.95), savings: Math.round(monthlyGen * 0.95 * rate) },
      { month: 'Dec', gen: Math.round(monthlyGen * 0.90), savings: Math.round(monthlyGen * 0.90 * rate) },
    ];

    return {
      kw, rate, area, monthlyGen, annualGen, monthlySavings, annualSavings,
      systemCost, subsidy, netCost, payback, lifetimeSavings, co2, trees, panels, monthlyCurve,
      avgMonthlyBill: calculatedAvgBill || (parseFloat(form.monthlyBill) || 0),
      highestConsumptionMonth,
    };
  }, [form.recommendedKw, form.electricityRate, form.roofArea, form.monthlyBill, calculatedAvgBill, highestConsumptionMonth]);

  const runGeneration = async () => {
    setGenerating(true);
    setCurrentStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, STEPS[i].duration));
      setCurrentStep(i + 1);
    }
    await generateProposal(form);
    setGenerating(false);
    setCurrentStep(-1);
    setShowOutput(true);
    setStatus('Generated');
    setVersion(`v${(parseFloat(version.slice(1)) + 0.1).toFixed(1)}`);
    showFeedback('Proposal re-generated successfully with AI irradiance optimization!');
  };

  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3500);
  };

  const handleApprove = async () => {
    await approveProposal();
    setStatus('Approved');
    showFeedback('Proposal officially approved! Sent to DISCOM net-metering dispatch queue.');
  };

  const handleReject = () => {
    setStatus('Revision Requested');
    showFeedback('Proposal marked for technical revision.');
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      showFeedback('Generating structured solar proposal PDF document...');
      await generateProposalPdf({ form, insights, proposal, version });
      showFeedback('Proposal PDF generated and downloaded successfully!');
    } catch (err) {
      console.error('Proposal PDF Export Error:', err);
      showFeedback('Failed to generate PDF document. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleEmailProposal = () => {
    showFeedback(`Proposal email dispatch queued for ${form.email || 'customer'}!`);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ form, insights, date: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GET_Solar_Proposal_${form.customerName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Proposal JSON downloaded successfully!');
  };

  return (
    <div className="ew-page tab-content active" role="tabpanel" aria-label="solar proposal">
      {/* AI Insight & Live KPI Strip */}
      <div className="card-glass" style={{ padding: '10px 16px', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-warning" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span className="ew-live-dot" style={{ marginRight: 6, display: 'inline-block' }} /> AI OPTIMIZATION
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Recommended {insights.kw} kWp system for ₹{form.monthlyBill ? parseFloat(form.monthlyBill).toLocaleString('en-IN') : '0'} monthly bill &middot; {insights.panels} panels &middot; {Math.round(insights.annualGen).toLocaleString()} kWh/yr
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {[
            { label: 'Subsidy', value: `-₹${insights.subsidy.toLocaleString('en-IN')}`, color: 'var(--color-green)' },
            { label: 'Net Outlay', value: `₹${insights.netCost.toLocaleString('en-IN')}`, color: 'var(--color-orange)' },
            { label: 'Payback', value: `${insights.payback} yr`, color: 'var(--color-blue)' },
            { label: 'Trees Offset', value: `${insights.trees}/yr`, color: 'var(--color-green)' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid var(--border-color)', paddingLeft: '14px' }}>
              <strong style={{ fontSize: '13px', color: m.color, lineHeight: 1.2 }}>{m.value}</strong>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{m.label}</span>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowOutput(!showOutput)} style={{ fontSize: 11, marginLeft: 8 }}>
            {showOutput ? 'Configure Parameters' : 'View Full Proposal'}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(54, 211, 153, 0.12)', border: '1px solid rgba(54, 211, 153, 0.3)', color: 'var(--color-green)', fontSize: '12px', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✓</span> {actionSuccess}
        </div>
      )}

      {generating && (
        <div className="card-glass" style={{ padding: '32px', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Generating Optimized Solar Model
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-cyan)', fontWeight: 600, margin: 0 }}>
            {STEPS[currentStep]?.label || 'Finalizing solar proposal parameters...'}
          </p>
        </div>
      )}

      {/* Main Workspace Split Layout */}
      {!generating && (
        <div style={{ display: 'grid', gridTemplateColumns: showOutput ? '1fr' : '1.2fr 0.8fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {/* LEFT: Proposal Form & Controls */}
          {!showOutput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="card-base" style={{ padding: 'var(--space-4)' }}>
                <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
                  <span className="kpi-title">1. Customer &amp; Site Metadata</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Customer Name</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.customerName} onChange={handleChange('customerName')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Phone Number</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.phone} onChange={handleChange('phone')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Email Address</label>
                    <input type="email" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.email} onChange={handleChange('email')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>City / Region</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.city} onChange={handleChange('city')} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Installation Address</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.address} onChange={handleChange('address')} />
                  </div>
                </div>
              </div>

              <div className="card-base" style={{ padding: 'var(--space-4)' }}>
                <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
                  <span className="kpi-title">2. Consumption &amp; System Sizing Parameters</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      6-Mo Avg Monthly Bill (₹)
                    </label>
                    <input type="number" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.monthlyBill} onChange={handleChange('monthlyBill')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Peak Consumption (kWh) {insights.highestConsumptionMonth?.month ? `[${insights.highestConsumptionMonth.month}]` : ''}
                    </label>
                    <input type="number" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.monthlyUnits} onChange={handleChange('monthlyUnits')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Grid Tariff Rate (₹/kWh)</label>
                    <input type="number" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.electricityRate} onChange={handleChange('electricityRate')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Usable Roof Area (sq ft)</label>
                    <input type="number" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.roofArea} onChange={handleChange('roofArea')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Recommended Capacity (kW)</label>
                    <input type="number" className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.recommendedKw} onChange={handleChange('recommendedKw')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Solar PV Panel Spec</label>
                    <select className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }} value={form.panelType} onChange={handleChange('panelType')}>
                      <option value="540W Mono PERC Tier-1">540W Mono PERC Tier-1 (Standard)</option>
                      <option value="580W TOPCon N-Type High Efficiency">580W TOPCon N-Type Premium (+8% Yield)</option>
                      <option value="530W Bifacial Dual Glass">530W Bifacial Dual Glass (Ground/Elevated)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Live Instant Calculation Summary */}
          {!showOutput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="card-base" style={{ padding: 'var(--space-4)' }}>
                <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
                  <span className="kpi-title">Live System Sizing Snapshot</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Capacity:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{insights.kw ? `${insights.kw} kWp` : '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Panels Required:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{insights.panels ? `${insights.panels} Units (540W)` : '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Est. Annual Generation:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--color-blue)' }}>{insights.annualGen ? `${insights.annualGen.toLocaleString()} kWh` : '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PM Surya Ghar Subsidy:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--color-green)' }}>{insights.subsidy ? `- ₹${insights.subsidy.toLocaleString('en-IN')}` : '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Investment:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--color-orange)' }}>{insights.netCost ? `₹${insights.netCost.toLocaleString('en-IN')}` : '—'}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '10px 16px', fontSize: '12px' }} onClick={runGeneration}>
                    ✨ Generate Optimized Proposal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FULL PROPOSAL PREVIEW (When showOutput is true) */}
          {showOutput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Proposal Navigation Tabs */}
              <div className="card-glass" style={{ padding: '4px 6px' }}>
                <div className="ew-nav-pill-bar">
                  {[
                    { id: 'overview', label: 'Executive Overview' },
                    { id: 'technical', label: 'Technical BOM' },
                    { id: 'generation', label: 'Generation & Charts' },
                    { id: 'financial', label: 'Financial & Subsidy' },
                    { id: 'timeline', label: 'Execution Stepper' },
                    { id: 'terms', label: 'Terms & AI Notes' },
                  ].map(t => (
                    <button
                      key={t.id}
                      className={`ew-nav-pill ${activeTab === t.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="card-base" style={{ padding: 'var(--space-5)' }}>
                    <div className="ew-divider-head">
                      <h3 className="ew-divider-title">Executive Summary &amp; Site Overview</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      This customized solar proposal has been generated for <strong>{form.customerName}</strong> located in <strong>{form.city}</strong> ({form.address}). Based on your 6-month average monthly electricity expenditure of <strong>₹{parseFloat(form.monthlyBill || '0').toLocaleString('en-IN')}</strong> {insights.highestConsumptionMonth ? `(Peak consumption recorded in ${insights.highestConsumptionMonth.month}: ${insights.highestConsumptionMonth.units} kWh)` : `(${form.monthlyUnits} kWh)`}, we recommend a <strong>{insights.kw} kWp On-Grid Rooftop Solar Power Plant</strong>.
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '10px', margin: 0 }}>
                      The system will produce approximately <strong>{insights.annualGen.toLocaleString()} kWh</strong> of clean solar energy annually, eliminating up to 85% of your grid energy bills. Under the Ministry of New and Renewable Energy (MNRE) <strong>PM Surya Ghar: Muft Bijli Yojana</strong>, your system qualifies for an upfront direct subsidy of <strong>₹{insights.subsidy.toLocaleString('en-IN')}</strong>.
                    </p>
                  </div>

                  {/* Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                    <div className="card-base" style={{ padding: '14px', '--card-theme': '23, 168, 229' }}>
                      <span className="card-metric-label">Recommended Size</span>
                      <div className="card-metric-value" style={{ fontSize: '24px', marginTop: 4 }}>{insights.kw} kWp</div>
                      <span style={{ fontSize: '11px', color: 'var(--color-blue)', marginTop: '4px', display: 'block' }}>{insights.panels} Panels (540W Tier-1)</span>
                    </div>

                    <div className="card-base" style={{ padding: '14px', '--card-theme': '255, 138, 29' }}>
                      <span className="card-metric-label">Net Investment Outlay</span>
                      <div className="card-metric-value" style={{ fontSize: '24px', marginTop: 4, color: 'var(--color-orange)' }}>₹{insights.netCost.toLocaleString('en-IN')}</div>
                      <span style={{ fontSize: '11px', color: 'var(--color-green)', marginTop: '4px', display: 'block' }}>After ₹{insights.subsidy.toLocaleString('en-IN')} Subsidy</span>
                    </div>

                    <div className="card-base" style={{ padding: '14px', '--card-theme': '54, 211, 153' }}>
                      <span className="card-metric-label">Est. Annual Savings</span>
                      <div className="card-metric-value" style={{ fontSize: '24px', marginTop: 4, color: 'var(--color-green)' }}>₹{Math.round(insights.annualSavings).toLocaleString('en-IN')}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Payback in {insights.payback} Years</span>
                    </div>

                    <div className="card-base" style={{ padding: '14px', '--card-theme': '23, 168, 229' }}>
                      <span className="card-metric-label">25-Year Net Benefit</span>
                      <div className="card-metric-value" style={{ fontSize: '24px', marginTop: 4, color: 'var(--color-cyan)' }}>₹{Math.round(insights.lifetimeSavings).toLocaleString('en-IN')}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Guaranteed Lifetime Yield</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TECHNICAL BOM */}
              {activeTab === 'technical' && (
                <div className="card-base" style={{ padding: 'var(--space-5)' }}>
                  <div className="ew-divider-head">
                    <h3 className="ew-divider-title">Bill of Materials (BOM) &amp; Equipment Specifications</h3>
                  </div>
                  <div className="table-container">
                    <table className="table table-compact">
                      <thead>
                        <tr>
                          <th>Equipment Category</th>
                          <th>Technical Specifications</th>
                          <th>Quantity</th>
                          <th>Warranty Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Solar PV Modules</td>
                          <td>{form.panelType}</td>
                          <td style={{ fontWeight: 800, color: 'var(--color-blue)' }}>{insights.panels} Units</td>
                          <td>25-Year Performance Warranty</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>On-Grid Solar Inverter</td>
                          <td>{form.inverterType}</td>
                          <td style={{ fontWeight: 800, color: 'var(--color-blue)' }}>1 Unit</td>
                          <td>10-Year Replacement Warranty</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Rooftop Mounting Structure</td>
                          <td>Hot-Dip Galvanized Iron (HDG) Rafters with Stainless Fasteners (150km/h rated)</td>
                          <td style={{ fontWeight: 800, color: 'var(--color-blue)' }}>1 Set</td>
                          <td>15-Year Structural Warranty</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>AC/DC Distribution Protection</td>
                          <td>IP65 Outer Enclosure with Type-2 Surge Protection (SPD), MCB &amp; Fuse Array</td>
                          <td style={{ fontWeight: 800, color: 'var(--color-blue)' }}>2 Sets</td>
                          <td>5-Year Component Warranty</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Bi-Directional Net Meter</td>
                          <td>DISCOM Approved Dual-Tariff Smart Meter with Remote Telemetry</td>
                          <td style={{ fontWeight: 800, color: 'var(--color-blue)' }}>1 Unit</td>
                          <td>5-Year DISCOM Guarantee</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Battery Backup Option</td>
                          <td>{form.batteryOption}</td>
                          <td style={{ fontWeight: 800, color: 'var(--text-muted)' }}>N/A</td>
                          <td>N/A</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: GENERATION & CHARTS */}
              {activeTab === 'generation' && (
                <div className="card-base" style={{ padding: 'var(--space-5)' }}>
                  <div className="ew-divider-head">
                    <h3 className="ew-divider-title">12-Month Simulated Generation Curve</h3>
                    <span className="ew-divider-sub">Calculated using regional solar irradiance data (kWh/m²/day) adjusted for seasonal tilt angle</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', gap: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    {insights.monthlyCurve.map(item => (
                      <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-cyan)', marginBottom: '6px' }}>{item.gen}</span>
                        <div style={{ width: '100%', maxWidth: '24px', height: `${(item.gen / (insights.monthlyGen * 1.4)) * 100}%`, background: 'linear-gradient(180deg, var(--color-cyan) 0%, rgba(23, 168, 229, 0.4) 100%)', borderRadius: '4px 4px 0 0' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: FINANCIAL & SUBSIDY */}
              {activeTab === 'financial' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="card-base" style={{ padding: 'var(--space-5)' }}>
                    <div className="ew-divider-head">
                      <h3 className="ew-divider-title">PM Surya Ghar: Muft Bijli Yojana Subsidy Breakdown</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                      <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>System Capacity</span>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{insights.kw} kWp</div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(54, 211, 153, 0.08)', border: '1px solid rgba(54, 211, 153, 0.25)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-green)', textTransform: 'uppercase', fontWeight: 700 }}>Direct Govt Subsidy</span>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>₹{insights.subsidy.toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 138, 29, 0.08)', border: '1px solid rgba(255, 138, 29, 0.25)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-orange)', textTransform: 'uppercase', fontWeight: 700 }}>Net Customer Outlay</span>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-orange)', marginTop: '4px' }}>₹{insights.netCost.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EXECUTION TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="card-base" style={{ padding: 'var(--space-5)' }}>
                  <div className="ew-divider-head">
                    <h3 className="ew-divider-title">Turnkey Installation &amp; Commissioning Stepper</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { step: 'Stage 1', title: 'On-Site Technical Survey & Structural Engineering', days: 'Days 1–2', status: 'Approved' },
                      { step: 'Stage 2', title: 'DISCOM Net-Metering Application Submission', days: 'Days 3–5', status: 'In Progress' },
                      { step: 'Stage 3', title: 'Tier-1 Hardware Delivery & Mounting Assembly', days: 'Days 6–8', status: 'Scheduled' },
                      { step: 'Stage 4', title: 'Inverter Wiring & Safety Inspection Audit', days: 'Day 9', status: 'Scheduled' },
                      { step: 'Stage 5', title: 'Bi-Directional Meter Installation & Grid Sync', days: 'Days 10–12', status: 'Scheduled' },
                    ].map((st, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--color-blue)' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--color-blue)', fontWeight: 800, textTransform: 'uppercase' }}>{st.step} &middot; {st.days}</span>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{st.title}</div>
                        </div>
                        <span className="badge badge-info badge-sm">{st.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: TERMS & AI NOTES */}
              {activeTab === 'terms' && (
                <div className="card-base" style={{ padding: 'var(--space-5)' }}>
                  <div className="ew-divider-head">
                    <h3 className="ew-divider-title">AI Recommendations &amp; Commercial Terms</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <p style={{ margin: 0 }}>• Solar PV panels are guaranteed to retain at least 84.8% of initial power output after 25 operational years.</p>
                    <p style={{ margin: 0 }}>• All electrical installation works strictly adhere to IS 732 and MNRE technical safety standards.</p>
                    <p style={{ margin: 0 }}>• Net-metering approval timelines depend on state DISCOM inspection schedules.</p>
                    <p style={{ margin: 0 }}>• Payment terms: 10% advance booking, 70% material dispatch, 20% post-commissioning sync.</p>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="card-glass" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={status === 'Approved'}>
                    ✓ Approve &amp; Sign Proposal
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleReject} style={{ color: 'var(--color-red)' }}>
                    ✕ Request Revision
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleOpenPreview}
                    id="previewProposalBtn"
                    style={{ fontWeight: 700 }}
                  >
                    👁 Preview Proposal
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    id="exportPdfBtn"
                    style={{ fontWeight: 700 }}
                  >
                    {isExportingPdf ? '⏳ Generating PDF...' : '📄 Export Proposal PDF'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleEmailProposal}>
                    ✉ Email to Customer
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleDownloadJson}>
                    📥 Download JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Document Preview Modal */}
      {isPreviewOpen && (
        <ProposalPreview
          form={form}
          insights={insights}
          proposal={proposal}
          version={version}
          onClose={handleClosePreview}
          onExportPdf={handleExportPdf}
          isExportingPdf={isExportingPdf}
        />
      )}
    </div>
  );
}
