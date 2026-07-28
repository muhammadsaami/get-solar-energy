import React, { useState } from 'react';

const DEFAULT_CHECKLIST = [
  { id: 'roof_accessible', label: 'Roof accessible', done: false },
  { id: 'roof_safe', label: 'Roof safe for walking', done: false },
  { id: 'panel_location', label: 'Panel location verified', done: false },
  { id: 'electrical_panel', label: 'Electrical panel inspected', done: false },
  { id: 'meter_confirmed', label: 'Meter confirmed', done: false },
  { id: 'ground_clearance', label: 'Ground clearance adequate', done: false },
  { id: 'tree_shading', label: 'Tree shading checked', done: false },
  { id: 'obstacles_documented', label: 'Obstacles documented', done: false },
  { id: 'safety_equipment', label: 'Safety equipment verified', done: false },
  { id: 'engineer_signature', label: 'Engineer signature obtained', done: false },
];

export default function SurveyChecklist({ survey, onUpdate }) {
  const [items, setItems] = useState(() => {
    if (survey?.checklist_items?.length > 0) return survey.checklist_items;
    if (survey?.checklist_items && typeof survey.checklist_items === 'string') {
      try { return JSON.parse(survey.checklist_items); } catch { return DEFAULT_CHECKLIST; }
    }
    return DEFAULT_CHECKLIST;
  });

  const toggleItem = async (id) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setItems(updated);
    if (onUpdate) await onUpdate(updated);
  };

  const doneCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href="#icon-clipboard-check" />
          </svg>
          Safety & Inspection Checklist
        </h3>
        <div style={{
          padding: '4px 14px', borderRadius: 'var(--radius-full)',
          background: pct === 100 ? 'var(--color-green-surface)' : 'var(--color-orange-surface)',
          color: pct === 100 ? 'var(--color-green)' : 'var(--color-orange)',
          fontSize: 'var(--font-size-xs)', fontWeight: 700,
        }}>
          {doneCount}/{totalCount} &middot; {pct}%
        </div>
      </div>

      <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, marginBottom: 'var(--space-5)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pct === 100 ? 'var(--color-green)' : 'var(--color-orange)',
          borderRadius: 3, transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.map((item) => (
          <label
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer', userSelect: 'none',
              background: item.done ? 'rgba(34,197,94,0.05)' : 'var(--bg-card)',
              border: `1px solid ${item.done ? 'rgba(34,197,94,0.15)' : 'var(--border-color)'}`,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { if (!item.done) e.currentTarget.style.borderColor = 'var(--glass-border-active)'; }}
            onMouseLeave={(e) => { if (!item.done) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 'var(--radius-sm)',
              border: `2px solid ${item.done ? 'var(--color-green)' : 'var(--border-color)'}`,
              background: item.done ? 'var(--color-green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all var(--transition-fast)',
            }}>
              {item.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span style={{
              fontSize: 'var(--font-size-sm)', flex: 1,
              color: item.done ? 'var(--color-green)' : 'var(--text-primary)',
              fontWeight: item.done ? 500 : 400,
              textDecoration: item.done ? 'line-through' : 'none',
              transition: 'all var(--transition-fast)',
            }}>
              {item.label}
            </span>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleItem(item.id)}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
              aria-label={item.label}
            />
          </label>
        ))}
      </div>
    </div>
  );
}