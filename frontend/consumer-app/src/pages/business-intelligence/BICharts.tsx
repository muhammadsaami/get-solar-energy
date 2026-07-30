import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import type { BISectionProps } from './bi.types'

const grid = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' }
const tick = { fontSize: 10, fill: 'var(--text-muted)' }
const tooltipStyle: React.CSSProperties = {
  background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)',
  borderRadius: '8px', fontSize: '11px',
}

interface TooltipPayloadEntry {
  color?: string
  name?: string
  value?: number | string
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ fontSize: 10, color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
        </div>
      ))}
    </div>
  )
}

const CHART_COLORS = ['#ff8a1d', '#17a8e5', '#36d399', '#7c5dfa', '#f43f5e', '#fbbf24', '#06b6d4', '#ec4899', '#84cc16', '#f97316']

function ChartCard({ title, subtitle, children, loading, error }: {
  title: string; subtitle?: string; children?: React.ReactNode; loading?: boolean; error?: string | null
}) {
  return (
    <div className="card-base" style={{ '--card-theme': CHART_COLORS[0] } as React.CSSProperties} role="region" aria-label={title}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="kpi-title" style={{ fontSize: '13px', fontWeight: 600 }}>{title}</span>
        {subtitle && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>{subtitle}</span>}
      </div>
      <div style={{ padding: 'var(--space-3)' }}>
        {loading && <div className="skeleton skeleton-block" style={{ height: 200, width: '100%', borderRadius: 'var(--radius-md)' }} />}
        {!loading && error && <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--accent-red, #ef4444)' }}>{error}</div>}
        {!loading && !error && children}
      </div>
    </div>
  )
}

function RevenueChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!adminData.admin?.charts?.revenueTrend) return []
    return adminData.admin.charts.revenueTrend.map((d: { month: string; revenue: number }) => ({
      month: d.month, revenue: Math.round(d.revenue),
    }))
  }, [adminData])

  if (!chartData.length && !loading) return null
  return (
    <ChartCard title="Revenue Trend" subtitle="Monthly" loading={loading}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="month" tick={tick} />
          <YAxis tick={tick} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#36d399" fill="#36d399" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function CustomerGrowthChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!adminData.admin?.charts?.customerGrowth) return []
    return adminData.admin.charts.customerGrowth.map((d: { period: string; value: number }) => ({
      month: d.period, customers: d.value,
    }))
  }, [adminData])

  if (!chartData.length && !loading) return null
  return (
    <ChartCard title="Customer Growth" subtitle="Cumulative" loading={loading}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="month" tick={tick} />
          <YAxis tick={tick} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="customers" fill="#17a8e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function PipelineFunnelChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!adminData.admin?.charts?.pipelineFunnel) return []
    return adminData.admin.charts.pipelineFunnel
  }, [adminData])

  if (!chartData.length && !loading) return null
  const maxVal = Math.max(...chartData.map((s: { value: number }) => s.value), 1)
  return (
    <ChartCard title="Sales Pipeline Funnel" subtitle="Stage breakdown" loading={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
        {chartData.map((item: { stage: string; value: number }, i: number) => {
          const pct = (item.value / maxVal) * 100
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 3 }}>
                <span style={{ fontWeight: 500 }}>{item.stage}</span>
                <span style={{ fontWeight: 700 }}>{item.value.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg-tertiary)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 5, transition: 'width 0.5s' }} />
              </div>
              {i < chartData.length - 1 && (
                <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)', margin: '1px 0' }}>
                  {Math.round((1 - chartData[i + 1].value / Math.max(item.value, 1)) * 100)}% drop-off
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

function RevenueByRegionChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!adminData.admin?.geography) return []
    return adminData.admin.geography.slice(0, 8).map((g: Record<string, unknown>) => ({
      name: (g.city as string) || 'Unknown',
      value: Number(g.total_system_value ?? g.customer_count ?? 0),
    }))
  }, [adminData])

  if (!chartData.length && !loading) return null
  return (
    <ChartCard title="Revenue by Region" subtitle="Top 8 cities" loading={loading}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} layout="vertical">
          <CartesianGrid {...grid} />
          <XAxis type="number" tick={tick} />
          <YAxis type="category" dataKey="name" tick={tick} width={70} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill="#ff8a1d" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function CustomerSegmentationChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!adminData.admin?.insights) return []
    const raw = adminData.admin.insights as Record<string, unknown>
    const segments = raw.segmentation as Record<string, number> | undefined
    if (!segments) return []
    return Object.entries(segments)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v]) => ({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: Number(v) }))
      .slice(0, 6)
  }, [adminData])

  if (!chartData.length && !loading) return null
  return (
    <ChartCard title="Customer Segmentation" loading={loading}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
            label={({ name, percent }: PieLabelRenderProps) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
            {chartData.map((_: unknown, i: number) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ConversionFunnelChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const pipeline = adminData.pipeline
  const funnelData = useMemo(() => {
    if (!pipeline?.stageCounts) return []
    const stages = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
    return stages.map(s => ({
      stage: s,
      count: (pipeline.stageCounts as Record<string, number>)[s] || 0,
    })).filter(d => d.count > 0)
  }, [pipeline])

  if (!funnelData.length && !loading) return null
  const maxCount = Math.max(...funnelData.map(d => d.count), 1)
  return (
    <ChartCard title="Conversion Funnel" subtitle="Lead to Won" loading={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
        {funnelData.map((item, i) => {
          const pct = (item.count / maxCount) * 100
          return (
            <div key={item.stage}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 3 }}>
                <span style={{ fontWeight: 500 }}>{item.stage}</span>
                <span style={{ fontWeight: 700 }}>{item.count.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg-tertiary)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 5 }} />
              </div>
              {i > 0 && (
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 1 }}>
                  {Math.round((1 - item.count / Math.max(funnelData[i - 1].count, 1)) * 100)}% from {funnelData[i - 1].stage}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

function ForecastChart({ data: adminData, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const forecast = useMemo(() => {
    if (!adminData.admin?.charts?.forecasting) return null
    return adminData.admin.charts.forecasting as Record<string, unknown>
  }, [adminData])

  if (loading) {
    return <ChartCard title="Forecast" loading={true} />
  }

  if (!forecast || Object.keys(forecast).length === 0) {
    return (
      <ChartCard title="Forecast">
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          Forecast unavailable — backend support required
        </div>
      </ChartCard>
    )
  }

  const items = [
    { label: 'Expected Monthly Revenue', value: forecast.expected_monthly_revenue, format: 'currency' },
    { label: 'Expected Customer Growth', value: forecast.expected_customer_growth, format: 'number' },
    { label: 'Expected Installed Capacity', value: forecast.expected_installed_capacity, format: 'kw' },
    { label: 'Expected Savings', value: forecast.expected_savings, format: 'currency' },
    { label: 'Projected Annual Revenue', value: forecast.projected_annual_revenue, format: 'currency' },
  ] as const

  return (
    <ChartCard title="Forecast" subtitle="Linear regression projections">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
        {items.map(item => (
          <div key={item.label} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-orange)' }}>
              {item.value == null ? 'N/A' : item.format === 'currency'
                ? `₹${(Number(item.value) / 100000).toFixed(1)}L`
                : item.format === 'kw'
                  ? `${Number(item.value).toFixed(1)} kW`
                  : Number(item.value).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

export default function BICharts({ data }: BISectionProps) {
  const loading = data.loading
  const hasData = data.admin !== null

  if (!loading && !hasData) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>
        <RevenueChart data={data} loading={loading} />
        <CustomerGrowthChart data={data} loading={loading} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>
        <PipelineFunnelChart data={data} loading={loading} />
        <ConversionFunnelChart data={data} loading={loading} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>
        <RevenueByRegionChart data={data} loading={loading} />
        <CustomerSegmentationChart data={data} loading={loading} />
      </div>
      <ForecastChart data={data} loading={loading} />
    </div>
  )
}
