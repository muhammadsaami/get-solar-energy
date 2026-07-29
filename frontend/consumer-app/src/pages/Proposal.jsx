import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlanning } from '../contexts/PlanningContext';
import ProposalCard from '../components/planning/ProposalCard';

const STEPS = [
  { id: 'analyzing', label: 'Analyzing consumption data...', duration: 800 },
  { id: 'estimating', label: 'Estimating system size...', duration: 900 },
  { id: 'calculating', label: 'Calculating savings...', duration: 700 },
  { id: 'preparing', label: 'Preparing proposal document...', duration: 1000 },
  { id: 'rendering', label: 'Rendering final document...', duration: 600 },
];

const INITIAL_FORM = {
  customerName: '', phone: '', email: '',
  address: '', city: '',
  monthlyBill: '', monthlyUnits: '', electricityRate: '',
  roofArea: '', recommendedKw: '',
};

const SECTIONS = ['customer', 'location', 'consumption', 'property'];

export default function Proposal() {
  const { proposal, generateProposal, error } = usePlanning();
  const [form, setForm] = useState(INITIAL_FORM);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showOutput, setShowOutput] = useState(!!proposal);
  const [expanded, setExpanded] = useState('customer');

  useEffect(() => {
    if (proposal) setShowOutput(true);
  }, [proposal]);

  const handleChange = useCallback((field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const insights = useMemo(() => {
    const kw = parseFloat(form.recommendedKw) || 0;
    const rate = parseFloat(form.electricityRate) || 0;
    const area = parseFloat(form.roofArea) || 0;
    const monthlyGen = kw * 4.5 * 30;
    const annualGen = monthlyGen * 12;
    const monthlySavings = monthlyGen * rate;
    const annualSavings = monthlySavings * 12;
    const systemCost = kw * 50000;
    const subsidy = kw <= 2 ? kw * 30000 : kw <= 3 ? 60000 + (kw - 2) * 18000 : 78000;
    const netCost = systemCost - subsidy;
    const payback = annualSavings > 0 ? netCost / annualSavings : 0;
    const co2 = annualGen * 0.0008;
    const panels = kw > 0 ? Math.ceil(kw * 1000 / 540) : 0;
    return { kw, rate, area, monthlyGen, annualGen, monthlySavings, annualSavings, systemCost, subsidy, netCost, payback, co2, panels };
  }, [form.recommendedKw, form.electricityRate, form.roofArea]);

  const runGeneration = async () => {
    setGenerating(true);
    setCurrentStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, STEPS[i].duration));
      setCurrentStep(i + 1);
    }
    const result = await generateProposal(form);
    setGenerating(false);
    setCurrentStep(-1);
    if (result.success) setShowOutput(true);
  };

  const fillSample = () => {
    setForm({
      customerName: 'Rajesh Sharma', phone: '98765-43210', email: 'rajesh@example.com',
      address: '42, Sunshine Apartments, MG Road', city: 'Pune',
      monthlyBill: '7200', monthlyUnits: '800', electricityRate: '9',
      roofArea: '450', recommendedKw: '5',
    });
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setShowOutput(false);
  };

  const hasData = {
    customer: !!(form.customerName || form.phone || form.email),
    location: !!(form.address || form.city),
    consumption: !!(form.monthlyBill || form.monthlyUnits || form.electricityRate),
    property: !!(form.roofArea || form.recommendedKw),
  };

  const sectionComplete = {
    customer: !!(form.customerName && form.phone && form.email),
    location: !!(form.address && form.city),
    consumption: !!(form.monthlyBill && form.monthlyUnits && form.electricityRate),
    property: !!(form.roofArea && form.recommendedKw),
  };

  const filledCount = SECTIONS.filter(s => sectionComplete[s]).length;
  const progressPct = Math.round(filledCount / SECTIONS.length * 100);

  const canGenerate = form.customerName && form.monthlyUnits && form.recommendedKw;
  const showSummary = form.customerName && form.city;

  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <ProposalKpiHeader />

      {!showOutput && !generating && (
        <div className="workspace-layout" style={{
          display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)', alignItems: 'start',
        }}>
          <div>
            <FormProgress progressPct={progressPct} filledCount={filledCount} sectionComplete={sectionComplete} />

            {showSummary && <CustomerSummary form={form} insights={insights} />}

            <AccordionSection
              title="Customer"
              sectionId="customer"
              expanded={expanded}
              onToggle={setExpanded}
              icon="icon-users"
              hasData={hasData.customer}
              complete={sectionComplete.customer}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <InputField label="Name" value={form.customerName} onChange={handleChange('customerName')} placeholder="e.g. Rajesh Sharma" icon="icon-users" />
                <InputField label="Phone" value={form.phone} onChange={handleChange('phone')} placeholder="98765-43210" icon="icon-chat" />
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <InputField label="Email" value={form.email} onChange={handleChange('email')} placeholder="customer@example.com" icon="icon-star" type="email" />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Location"
              sectionId="location"
              expanded={expanded}
              onToggle={setExpanded}
              icon="icon-mappin"
              hasData={hasData.location}
              complete={sectionComplete.location}
            >
              <InputField label="Address" value={form.address} onChange={handleChange('address')} placeholder="Street, building, area" icon="icon-mappin" />
              <div style={{ marginTop: 'var(--space-3)' }}>
                <InputField label="City" value={form.city} onChange={handleChange('city')} placeholder="e.g. Pune" icon="icon-mappin" />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Consumption"
              sectionId="consumption"
              expanded={expanded}
              onToggle={setExpanded}
              icon="icon-bill"
              hasData={hasData.consumption}
              complete={sectionComplete.consumption}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <InputField label="Monthly Bill" value={form.monthlyBill} onChange={handleChange('monthlyBill')} placeholder="7200" icon="icon-bill" prefix="₹" type="number" />
                <InputField label="Monthly Units" value={form.monthlyUnits} onChange={handleChange('monthlyUnits')} placeholder="800" icon="icon-electricity-consumption" suffix="kWh" type="number" />
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <InputField label="Electricity Rate" value={form.electricityRate} onChange={handleChange('electricityRate')} placeholder="9" icon="icon-calculator" suffix="₹/kWh" type="number" />
              </div>
            </AccordionSection>

            <AccordionSection
              title="Property"
              sectionId="property"
              expanded={expanded}
              onToggle={setExpanded}
              icon="icon-roof"
              hasData={hasData.property}
              complete={sectionComplete.property}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <InputField label="Roof Area" value={form.roofArea} onChange={handleChange('roofArea')} placeholder="450" icon="icon-roof" suffix="sq ft" type="number" />
                <InputField label="Recommended Capacity" value={form.recommendedKw} onChange={handleChange('recommendedKw')} placeholder="5" icon="icon-wrench" suffix="kW" type="number" />
              </div>
            </AccordionSection>
          </div>

          <div style={{ position: 'sticky', top: 'var(--space-6)' }}>
            <AiInsightsPanel insights={insights} hasAnyData={Object.values(hasData).some(Boolean)} />
            {!showOutput && <EmptyProposalPreview onFillSample={fillSample} />}
          </div>
        </div>
      )}

      {generating && <GenerationOverlay step={currentStep} />}

      {showOutput && proposal && !generating && (
        <ProposalCard proposal={proposal} />
      )}

      {error && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          background: 'var(--color-red-surface)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-red-border)',
          color: 'var(--color-red)', fontSize: 'var(--font-size-sm)',
        }}>
          {error}
        </div>
      )}

      <StickyActionBar
        onGenerate={runGeneration}
        onFillSample={fillSample}
        onReset={resetForm}
        canGenerate={canGenerate}
        generating={generating}
        hasProposal={showOutput}
      />
    </div>
  );
}

function ProposalKpiHeader() {
  const stats = [
    { value: '12', label: 'Proposals', icon: 'icon-reports', color: 'var(--color-blue)' },
    { value: '₹18.2L', label: 'Total Value', icon: 'icon-annual-savings', color: 'var(--color-orange)' },
    { value: '5.8 kW', label: 'Avg Size', icon: 'icon-wrench', color: 'var(--color-green)' },
    { value: '67%', label: 'Conversion', icon: 'icon-trending', color: 'var(--color-purple)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
      {stats.map((s, i) => (
        <div key={i} className="card-metric" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: `var(--color-${['blue', 'orange', 'green', 'purple'][i]}-surface)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <use href={`#${s.icon}`} />
            </svg>
          </div>
          <div>
            <div className="card-metric-value" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="card-metric-label" style={{ fontSize: 'var(--font-size-xs)' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormProgress({ progressPct, filledCount, sectionComplete }) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, var(--color-blue), var(--color-green))',
              width: `${progressPct}%`, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {filledCount}/{SECTIONS.length} sections
        </span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        {SECTIONS.map(s => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: sectionComplete[s] ? 'var(--color-green)' : 'var(--bg-tertiary)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
}

function CustomerSummary({ form, insights }) {
  return (
    <div className="card-glass" style={{
      padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-3)',
      borderLeft: '3px solid var(--color-orange)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-full)',
          background: 'var(--color-orange-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href="#icon-users" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{form.customerName}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            {form.city}{form.monthlyBill ? ` · ₹${parseFloat(form.monthlyBill).toLocaleString('en-IN')}/mo` : ''}{form.roofArea ? ` · ${form.roofArea} sq ft` : ''}
          </div>
        </div>
      </div>
      {insights.kw > 0 && (
        <div style={{
          padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)',
          background: 'var(--color-blue-surface)', color: 'var(--color-blue)',
          fontSize: 'var(--font-size-xs)', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          Est. {insights.kw} kW System
        </div>
      )}
    </div>
  );
}

function AccordionSection({ title, sectionId, expanded, onToggle, icon, children, hasData, complete }) {
  const isOpen = expanded === sectionId;
  return (
    <div className="card-glass" style={{
      padding: 0, marginBottom: 'var(--space-3)',
      overflow: 'hidden', transition: 'all var(--transition-normal)',
      borderColor: complete ? 'var(--border-green-glow)' : undefined,
    }}>
      <button
        onClick={() => onToggle(isOpen ? null : sectionId)}
        style={{
          width: '100%', padding: 'var(--space-3) var(--space-5)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600,
        }}
        aria-label={title}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href={`#${icon}`} />
          </svg>
          <span>{title}</span>
          {hasData && !complete && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 'var(--radius-full)',
              background: 'var(--color-orange-surface)', color: 'var(--color-orange)', fontWeight: 600,
            }}>
              In Progress
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {complete && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      <div style={{
        maxHeight: isOpen ? 500 : 0, overflow: 'hidden',
        transition: 'max-height 0.3s ease, opacity 0.25s ease',
        opacity: isOpen ? 1 : 0,
      }}>
        <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, icon, prefix, suffix, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
        {icon && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href={`#${icon}`} />
          </svg>
        )}
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{
            padding: '0 var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)',
            background: 'var(--bg-input)', border: '1px solid var(--border-color)',
            borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
            height: 40, display: 'flex', alignItems: 'center',
          }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="form-input"
          style={{
            flex: 1, height: 40, padding: '0 var(--space-3)',
            borderRadius: prefix ? '0 var(--radius-md) var(--radius-md) 0' : 'var(--radius-md)',
            ...(suffix ? { borderRight: 'none', borderRadius: prefix ? 0 : 'var(--radius-md) 0 0 var(--radius-md)' } : {}),
          }}
          aria-label={label}
        />
        {suffix && (
          <span style={{
            padding: '0 var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)',
            background: 'var(--bg-input)', border: '1px solid var(--border-color)',
            borderLeft: 'none', borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            height: 40, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
          }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

function AiInsightsPanel({ insights, hasAnyData }) {
  const groups = [
    {
      title: 'System', icon: 'icon-wrench',
      items: [
        { label: 'Capacity', value: insights.kw > 0 ? `${insights.kw.toFixed(1)} kW` : '—', icon: 'icon-wrench', color: 'var(--color-orange)' },
        { label: 'Panels', value: insights.panels > 0 ? `${insights.panels} panels` : '—', icon: 'icon-layout-dashboard', color: 'var(--color-blue)' },
        { label: 'Roof Usage', value: insights.area > 0 && insights.panels > 0 ? `${Math.min(100, Math.round(insights.panels * 2.5 * 100 / insights.area))}%` : '—', icon: 'icon-roof', color: 'var(--color-green)' },
      ],
    },
    {
      title: 'Energy', icon: 'icon-energy-production',
      items: [
        { label: 'Monthly Gen.', value: insights.monthlyGen > 0 ? `${Math.round(insights.monthlyGen).toLocaleString()} kWh` : '—', icon: 'icon-energy-production', color: 'var(--color-green)' },
        { label: 'Annual Gen.', value: insights.annualGen > 0 ? `${Math.round(insights.annualGen).toLocaleString()} kWh` : '—', icon: 'icon-energy-production', color: 'var(--color-blue)' },
      ],
    },
    {
      title: 'Financial', icon: 'icon-annual-savings',
      items: [
        { label: 'Monthly Savings', value: insights.monthlySavings > 0 ? `₹${Math.round(insights.monthlySavings).toLocaleString('en-IN')}` : '—', icon: 'icon-bill', color: 'var(--color-orange)' },
        { label: 'Annual Savings', value: insights.annualSavings > 0 ? `₹${Math.round(insights.annualSavings).toLocaleString('en-IN')}` : '—', icon: 'icon-annual-savings', color: 'var(--color-green)' },
        { label: 'Govt Subsidy', value: insights.subsidy > 0 ? `₹${Math.round(insights.subsidy).toLocaleString('en-IN')}` : '—', icon: 'icon-annual-savings', color: 'var(--color-green)' },
        { label: 'Payback Period', value: insights.payback > 0 ? `${insights.payback.toFixed(1)} years` : '—', icon: 'icon-calendar', color: 'var(--color-purple)' },
        { label: 'System Cost', value: insights.systemCost > 0 ? `₹${Math.round(insights.systemCost).toLocaleString('en-IN')}` : '—', icon: 'icon-calculator', color: 'var(--text-muted)' },
        { label: 'Net Cost', value: insights.netCost > 0 ? `₹${Math.round(insights.netCost).toLocaleString('en-IN')}` : '—', icon: 'icon-bill', color: 'var(--color-blue)' },
      ],
    },
    {
      title: 'Environmental', icon: 'icon-shield',
      items: [
        { label: 'CO₂ Offset /yr', value: insights.co2 > 0 ? `${insights.co2.toFixed(2)} tons` : '—', icon: 'icon-shield', color: 'var(--color-green)' },
      ],
    },
  ];

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href="#icon-sparkles" />
        </svg>
        <h3 className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>AI Insights</h3>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
          padding: '2px 8px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-green-surface)', fontSize: 10, fontWeight: 700, color: 'var(--color-green)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', animation: 'pulseWidgetDot 1.5s infinite' }} />
          Live Analysis
        </div>
      </div>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
        {hasAnyData ? 'Updating instantly based on your inputs.' : 'Start filling the form to see live estimates.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {groups.map((group, gi) => (
          <div key={gi}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)',
              marginBottom: 'var(--space-2)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${group.icon}`} />
              </svg>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {group.items.map((item, ii) => (
                <div key={ii} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-1) var(--space-2)',
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <use href={`#${item.icon}`} />
                    </svg>
                    {item.label}
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyProposalPreview({ onFillSample }) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--radius-2xl)',
        background: 'var(--color-orange-surface)', border: '1px solid var(--color-orange-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--space-4)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <use href="#icon-reports" />
        </svg>
      </div>
      <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-2)' }}>
        AI Proposal Preview
      </h4>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '0 0 var(--space-4)', lineHeight: 1.6 }}>
        Fill in customer details and system parameters, then generate a professional AI-powered solar proposal.
      </p>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-color)',
        padding: 'var(--space-4)', marginBottom: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 10, width: '20%', borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ height: 10, width: '80%', borderRadius: 4, marginBottom: 'var(--space-2)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <div className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '0 0 var(--space-3)', lineHeight: 1.5 }}>
        Your proposal will include executive summary, system design, financial breakdown, savings projections, and environmental impact.
      </p>
      <button className="btn btn-outline btn-sm" onClick={onFillSample} aria-label="Use sample data">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
          <use href="#icon-clipboard-check" />
        </svg>
        Use Sample Data
      </button>
    </div>
  );
}

function GenerationOverlay({ step }) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-8) var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--radius-2xl)',
        background: 'var(--color-orange-surface)', border: '1px solid var(--color-orange-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--space-4)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href="#icon-sparkles" />
        </svg>
      </div>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-1)' }}>
        Generating Your AI Proposal
      </h3>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: '0 0 var(--space-5)' }}>
        Please wait while we prepare your personalized solar proposal.
      </p>
      <div style={{ maxWidth: 360, margin: '0 auto' }}>
        <div style={{
          height: 4, background: 'var(--bg-tertiary)', borderRadius: 2,
          overflow: 'hidden', marginBottom: 'var(--space-3)',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, var(--color-orange), var(--color-blue))',
            width: `${Math.min(100, Math.round(step / STEPS.length * 100))}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {step >= 0 && step < STEPS.length && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-orange)', fontWeight: 600, margin: 0 }}>
            {STEPS[step]?.label || 'Processing...'}
          </p>
        )}
        {step >= STEPS.length && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-green)', fontWeight: 600, margin: 0 }}>
            Finalizing your proposal...
          </p>
        )}
      </div>
    </div>
  );
}

function StickyActionBar({ onGenerate, onFillSample, onReset, canGenerate, generating, hasProposal }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 50,
      paddingTop: 'var(--space-3)',
    }}>
      <div className="card-glass" style={{
        padding: 'var(--space-3) var(--space-5)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 'var(--space-3)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={onGenerate}
            disabled={!canGenerate || generating}
            aria-label="Generate Proposal"
            style={{ minWidth: 160, justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <use href="#icon-sparkles" />
            </svg>
            {generating ? 'Generating...' : 'Generate Proposal'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onFillSample} disabled={generating} aria-label="Auto fill sample data">
            Auto Fill
          </button>
          <button className="btn btn-outline btn-sm" onClick={onReset} disabled={generating} aria-label="Reset form">
            Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" disabled aria-label="Export PDF" style={{ opacity: hasProposal ? 1 : 0.4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button className="btn btn-outline btn-sm" disabled aria-label="Email proposal">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email
          </button>
        </div>
      </div>
    </div>
  );
}
