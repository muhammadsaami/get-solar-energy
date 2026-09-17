import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';

const formatCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${(val / 1000).toFixed(0)}K`;
};

function ChartCard({ title, children, loading }) {
  if (loading) {
    return (
      <div className="chart-card" style={{ minHeight: '260px' }}>
        <div className="skeleton skeleton-text medium" />
        <div className="skeleton skeleton-block" style={{ height: '200px', marginTop: 'var(--space-4)' }} />
      </div>
    );
  }
  return (
    <div className="chart-card" style={{ minHeight: '260px' }}>
      <div className="chart-card-header">
        <span className="chart-card-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ProjectAnalytics({ analytics, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <ChartCard key={i} title="" loading />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="table-empty" style={{ padding: 'var(--space-12) 0' }}>
        <div className="table-empty-icon">📊</div>
        <div className="table-empty-title">No analytics data available</div>
        <div className="table-empty-desc">Analytics will populate once projects are created and tracked.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }} className="animate-fade-in">
      <ChartCard title="Projects by Stage">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics.projectsByStage} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={100} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="count" fill="var(--color-blue)" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Installations">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics.monthlyInstallations} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="target" fill="var(--chart-4)" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="actual" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Completion Trend">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={analytics.completionTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line type="monotone" dataKey="target" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="actual" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue Forecast">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={analytics.revenueForecast} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="revProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area type="monotone" dataKey="projected" stroke="var(--chart-4)" fill="url(#revProjected)" strokeWidth={2} strokeDasharray="5 5" />
            <Area type="monotone" dataKey="actual" stroke="var(--chart-3)" fill="url(#revActual)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Team Productivity">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics.teamProductivity} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
            <Tooltip contentStyle={{ background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="completed" fill="var(--chart-3)" radius={[0, 4, 4, 0]} barSize={16} name="Completed" />
            <Bar dataKey="active" fill="var(--chart-2)" radius={[0, 4, 4, 0]} barSize={16} name="Active" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
