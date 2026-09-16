import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'customer', label: 'Customer & Location', icon: 'icon-users',
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'city', label: 'City', type: 'text', required: true },
    ],
  },
  {
    id: 'roof', label: 'Roof Information', icon: 'icon-roof',
    fields: [
      { key: 'roof_type', label: 'Roof Type', type: 'select', options: ['RCC Flat', 'Sloped Tin', 'Tiled', 'Metal Sheet', 'Other'], required: true },
      { key: 'roof_age_years', label: 'Roof Age (years)', type: 'number', required: true },
      { key: 'total_roof_area_sqft', label: 'Total Roof Area (sq ft)', type: 'number', required: true },
      { key: 'structure_condition', label: 'Structure Condition', type: 'select', options: ['Good', 'Fair', 'Needs Reinforcement', 'Poor'], required: true },
    ],
  },
  {
    id: 'electrical', label: 'Electrical', icon: 'icon-energy-production',
    fields: [
      { key: 'electrical_panel_distance_m', label: 'Panel Distance (meters)', type: 'number', required: true },
      { key: 'proposed_system_kw', label: 'Proposed System (kW)', type: 'number', required: true },
    ],
  },
  {
    id: 'safety', label: 'Safety & Environment', icon: 'icon-shield',
    fields: [
      { key: 'shading_present', label: 'Shading Present', type: 'select', options: ['No', 'Yes'], required: true },
      { key: 'shading_details', label: 'Shading Details', type: 'textarea' },
      { key: 'obstacles', label: 'Obstacles on Roof', type: 'textarea' },
    ],
  },
  {
    id: 'notes', label: 'Additional Notes', icon: 'icon-clipboard',
    fields: [
      { key: 'surveyor_notes', label: 'Surveyor Notes', type: 'textarea' },
      { key: 'customer_notes', label: 'Customer Notes', type: 'textarea' },
    ],
  },
];

export default function SurveyForm({ survey, onSubmit, loading }) {
  const [expandedSections, setExpandedSections] = useState({ customer: true });
  const [formData, setFormData] = useState(() => {
    const initial = {};
    SECTIONS.forEach(s => s.fields.forEach(f => {
      initial[f.key] = survey?.[f.key] ?? (f.type === 'select' && f.key === 'shading_present' ? 'No' : '');
    }));
    return initial;
  });

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (data.shading_present === 'Yes' || data.shading_present === true) {
      data.shading_present = true;
    } else {
      data.shading_present = false;
      if (!data.shading_details) data.shading_details = 'None';
    }
    if (data.roof_age_years) data.roof_age_years = parseInt(data.roof_age_years, 10);
    if (data.total_roof_area_sqft) data.total_roof_area_sqft = parseFloat(data.total_roof_area_sqft);
    if (data.electrical_panel_distance_m) data.electrical_panel_distance_m = parseFloat(data.electrical_panel_distance_m);
    if (data.proposed_system_kw) data.proposed_system_kw = parseFloat(data.proposed_system_kw);
    onSubmit(data);
  };

  const totalFields = SECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
  const filledCount = Object.values(formData).filter(v => v !== '' && v !== null && v !== undefined).length;
  const pct = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Site Survey Form
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {filledCount}/{totalFields} fields &middot; {pct}% complete
          </p>
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading} aria-label="Save survey form">
          {loading ? (
            <>
              <span className="skeleton" style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
              Saving...
            </>
          ) : survey ? 'Update Survey' : 'Save & Run AI Analysis'}
        </button>
      </div>

      <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, marginBottom: 'var(--space-5)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pct === 100 ? 'var(--color-green)' : 'var(--color-orange)',
          borderRadius: 3, transition: 'width 0.5s ease',
        }} />
      </div>

      {SECTIONS.map((section) => {
        const isOpen = expandedSections[section.id] || false;
        const sectionFilled = section.fields.filter(f => {
          const v = formData[f.key]; return v !== '' && v !== null && v !== undefined;
        }).length;

        return (
          <div key={section.id} className="card-glass" style={{
            marginBottom: 'var(--space-3)', overflow: 'hidden',
            border: isOpen ? '1px solid var(--glass-border-active)' : '1px solid var(--glass-border)',
            transition: 'border var(--transition-normal)',
          }}>
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              style={{
                width: '100%', padding: 'var(--space-4) var(--space-5)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600,
              }}
              aria-expanded={isOpen}
              aria-label={`${section.label} section`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 'var(--radius-sm)',
                  background: sectionFilled === section.fields.length ? 'var(--color-green-surface)' : 'var(--color-orange-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sectionFilled === section.fields.length ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-orange)' }}>{sectionFilled}/{section.fields.length}</span>
                  )}
                </div>
                {section.label}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isOpen && (
              <div style={{ padding: '0 var(--space-5) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                      {field.label} {field.required && <span style={{ color: 'var(--color-red)' }}>*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="form-input"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)', transition: 'border var(--transition-fast)' }}
                        aria-label={field.label}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="form-input"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                        aria-label={field.label}
                      >
                        <option value="">Select...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        className="form-input"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                        aria-label={field.label}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </form>
  );
}