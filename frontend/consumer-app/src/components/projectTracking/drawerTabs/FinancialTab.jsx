import React from 'react';
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md';

const formatCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

export default function FinancialTab({ project }) {
  const totalCost = project.materialsCost + project.laborCost + project.miscCost;
  const profit = project.revenue.actual - totalCost;
  const profitMargin = project.revenue.actual > 0 ? (profit / project.revenue.actual * 100) : 0;
  const budgetUtilization = project.totalBudget > 0 ? (totalCost / project.totalBudget * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-green)' }}>
              {formatCurrency(project.revenue.actual)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budget</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {formatCurrency(project.totalBudget)}
            </div>
          </div>
        </div>
        <div className="progress-track" style={{ height: '8px' }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, budgetUtilization)}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-1)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{budgetUtilization.toFixed(0)}% utilized</span>
          <span>₹{(project.totalBudget - totalCost) > 0 ? `${formatCurrency(project.totalBudget - totalCost)} remaining` : 'Over budget'}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          Cost Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            { label: 'Materials', value: project.materialsCost, pct: totalCost > 0 ? (project.materialsCost / totalCost * 100) : 0 },
            { label: 'Labor', value: project.laborCost, pct: totalCost > 0 ? (project.laborCost / totalCost * 100) : 0 },
            { label: 'Miscellaneous', value: project.miscCost, pct: totalCost > 0 ? (project.miscCost / totalCost * 100) : 0 }
          ].map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{formatCurrency(item.value)}</span>
              </div>
              <div className="progress-track" style={{ height: '4px' }}>
                <div className="progress-fill" style={{ width: `${item.pct.toFixed(0)}%` }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.pct.toFixed(0)}% of total</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          Profit & Margin
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Profit</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: profit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
              {formatCurrency(profit)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit Margin</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: profitMargin >= 15 ? 'var(--color-green)' : profitMargin >= 5 ? 'var(--color-yellow)' : 'var(--color-red)' }}>
              {profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          {profitMargin >= 15 ? <MdTrendingUp style={{ color: 'var(--color-green)' }} /> : <MdTrendingDown style={{ color: 'var(--color-red)' }} />}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            {profitMargin >= 15 ? 'Healthy margin' : profitMargin >= 5 ? 'Acceptable margin' : 'Low margin — review costs'}
          </span>
        </div>
      </div>
    </div>
  );
}
