import React from 'react';
import { MdTrendingUp, MdTrendingDown, MdCheckCircle, MdSchedule, MdWarning, MdAttachMoney } from 'react-icons/md';

const formatCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

const cards = [
  {
    key: 'active', label: 'Active Projects', icon: MdSchedule,
    accent: 'accent-blue', formatter: (v) => String(v)
  },
  {
    key: 'completedProjects', label: 'Completed Projects', icon: MdCheckCircle,
    accent: 'accent-green', formatter: (v) => String(v)
  },
  {
    key: 'delayedProjects', label: 'Delayed Projects', icon: MdWarning,
    accent: 'accent-orange', formatter: (v) => String(v)
  },
  {
    key: 'avgCompletionPercent', label: 'Avg Completion', icon: MdTrendingUp,
    accent: 'accent-purple', formatter: (v) => `${v}%`
  },
  {
    key: 'totalRevenue', label: 'Revenue Realised', icon: MdAttachMoney,
    accent: 'accent-green', formatter: formatCurrency
  },
  {
    key: 'pipelineRevenue', label: 'Pipeline Revenue', icon: MdTrendingDown,
    accent: 'accent-blue', formatter: formatCurrency
  }
];

export default function KpiCards({ kpis, loading, error }) {
  if (loading) {
    return (
      <div className="card-grid card-grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {cards.map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: '120px' }}>
            <div className="skeleton skeleton-text narrow" />
            <div className="skeleton skeleton-text wide" style={{ height: '28px', marginTop: 'var(--space-3)' }} />
            <div className="skeleton skeleton-text medium" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-red)' }}>
        <MdWarning size={32} />
        <p>{error}</p>
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
      {cards.map(({ key, label, icon: Icon, accent, formatter }) => {
        const value = kpis[key];
        let changeClass = 'neutral';
        let changeText = '';

        if (key === 'activeProjects') { changeClass = 'positive'; changeText = `${kpis.total} total projects`; }
        if (key === 'delayedProjects') { changeClass = value > 2 ? 'negative' : 'positive'; changeText = value > 2 ? 'Needs attention' : 'On track'; }
        if (key === 'avgCompletionPercent') { changeClass = value > 50 ? 'positive' : 'neutral'; changeText = value > 50 ? 'Above threshold' : 'Below threshold'; }
        if (key === 'totalRevenue') { changeClass = 'positive'; changeText = `${formatCurrency(kpis.pipelineRevenue)} pipeline`; }

        return (
          <div key={key} className={`card-metric ${accent}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span className="card-metric-label">{label}</span>
              <Icon style={{ fontSize: '22px', color: 'var(--text-muted)', opacity: 0.6 }} />
            </div>
            <div className="card-metric-value" style={{ fontSize: 'var(--font-size-3xl)' }}>
              {formatter(value)}
            </div>
            {changeText && (
              <div className={`card-metric-change ${changeClass}`}>
                {changeClass === 'positive' ? <MdTrendingUp /> : changeClass === 'negative' ? <MdTrendingDown /> : null}
                {changeText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
