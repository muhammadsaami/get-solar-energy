import React, { useState, useCallback } from 'react';
import { MdClose, MdFilterList } from 'react-icons/md';
import { STAGES, PRIORITIES } from '../../services/projectTracking.service';

const FILTER_DEFS = [
  { key: 'stage', label: 'Status', type: 'select', options: STAGES.map(s => ({ value: s.id, label: s.label })) },
  { key: 'customer', label: 'Customer', type: 'text', placeholder: 'Search customer' },
  { key: 'city', label: 'City', type: 'select', options: [
    { value: 'Jaipur', label: 'Jaipur' }, { value: 'Delhi', label: 'Delhi' },
    { value: 'Mumbai', label: 'Mumbai' }, { value: 'Bangalore', label: 'Bangalore' },
    { value: 'Pune', label: 'Pune' }, { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Lucknow', label: 'Lucknow' }, { value: 'Hyderabad', label: 'Hyderabad' }
  ]},
  { key: 'engineer', label: 'Engineer', type: 'select', options: [
    { value: 'Ravi Sharma', label: 'Ravi Sharma' }, { value: 'Priya Patel', label: 'Priya Patel' },
    { value: 'Amit Verma', label: 'Amit Verma' }, { value: 'Sneha Gupta', label: 'Sneha Gupta' },
    { value: 'Vikram Singh', label: 'Vikram Singh' }
  ]},
  { key: 'installer', label: 'Installer', type: 'select', options: [
    { value: 'Raj Kumar', label: 'Raj Kumar' }, { value: 'Sunil Yadav', label: 'Sunil Yadav' },
    { value: 'Deepak Mishra', label: 'Deepak Mishra' }, { value: 'Anil Joshi', label: 'Anil Joshi' },
    { value: 'Manoj Tiwari', label: 'Manoj Tiwari' }
  ]},
  { key: 'capacity', label: 'Capacity', type: 'select', options: [
    { value: '0-10', label: '0-10 kW' }, { value: '10-50', label: '10-50 kW' },
    { value: '50-100', label: '50-100 kW' }, { value: '100-500', label: '100-500 kW' }
  ]},
  { key: 'priority', label: 'Priority', type: 'select', options: Object.entries(PRIORITIES).map(([value, label]) => ({ value, label })) },
  { key: 'projectType', label: 'Project Type', type: 'select', options: [
    { value: 'new', label: 'New Installation' }, { value: 'retrofit', label: 'Retrofit' }, { value: 'expansion', label: 'Expansion' }
  ]}
];

export default function EnterpriseFilters({ activeFilters, onFilter }) {
  const [localFilters, setLocalFilters] = useState(activeFilters || {});

  const handleChange = useCallback((key, value) => {
    const next = { ...localFilters };
    if (!value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    setLocalFilters(next);
    onFilter(next);
  }, [localFilters, onFilter]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onFilter({});
  }, [onFilter]);

  const activeCount = Object.keys(localFilters).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="filter-bar">
        {FILTER_DEFS.map(({ key, label, type, options, placeholder }) => (
          <div key={key} className="form-group" style={{ margin: 0, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '2px' }} htmlFor={`filter-${key}`}>{label}</label>
            {type === 'select' ? (
              <select
                id={`filter-${key}`}
                className="form-select"
                value={localFilters[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                aria-label={`Filter by ${label}`}
              >
                <option value="">All</option>
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                id={`filter-${key}`}
                type="text"
                className="form-input"
                placeholder={placeholder || `Search ${label}`}
                value={localFilters[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                aria-label={`Filter by ${label}`}
              />
            )}
          </div>
        ))}
        <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            <MdFilterList style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {activeCount} active
          </span>
        </div>
      </div>
      {activeCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
          {Object.entries(localFilters).map(([key, value]) => {
            const def = FILTER_DEFS.find(f => f.key === key);
            return (
              <span key={key} className="tag">
                {def?.label || key}: {value}
                <button
                  className="tag-remove"
                  onClick={() => handleChange(key, '')}
                  aria-label={`Remove ${def?.label || key} filter`}
                >
                  <MdClose size={12} />
                </button>
              </span>
            );
          })}
          <button className="btn btn-ghost btn-xs" onClick={handleClear} style={{ color: 'var(--color-red)' }}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
