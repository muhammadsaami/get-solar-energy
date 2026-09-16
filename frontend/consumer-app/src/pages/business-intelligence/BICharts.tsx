import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import type { BISectionProps } from './bi.types'

const grid = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' }
const tick = { fontSize: 10, fill: 'var(--text-muted)' }
const tooltipStyle: React.CSSProperties = {
  background: 'var(--bg-tooltip)', border: '1px solid var(--border-color)',
  borderRadius: '8px', fontSize: '11px',
}

const FROZEN = ['#ff8a1d', '#17a8e5', '#36d399', '#fbbf24', '#f43f5e']

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

function ChartCard({ title, subtitle, children, loading, empty }: {
  title: string; subtitle?: string; children?: React.ReactNode; loading?: boolean; empty?: boolean
}) {
  return (
    <div className="card-base" role="region" aria-label={title}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="kpi-title" style={{ fontSize: '13px', fontWeight: 600 }}>{title}</span>
        {subtitle && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>{subtitle}</span>}
      </div>
      <div style={{ padding: 'var(--space-3)' }}>
        {loading && <div className="skeleton skeleton-block" style={{ height: 200, width: '100%', borderRadius: 'var(--radius-md)' }} />}
        {!loading && empty && (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            No data for this period yet
          </div>
        )}
        {!loading && !empty && children}
      </div>
    </div>
  )
}

function RevenueTrendChart({ data, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!data.admin?.charts?.revenueTrend) return []
    return data.admin.charts.revenueTrend.map((d: { month: string; revenue: number }) => ({
      month: d.month, revenue: Math.round(d.revenue),
    }))
  }, [data])

  return (
    <ChartCard title="Are we improving?" subtitle="Revenue trend" loading={loading} empty={chartData.length === 0}>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="month" tick={tick} />
            <YAxis tick={tick} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#36d399" fill="#36d399" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

function PipelineFunnelChart({ data, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!data.admin?.charts?.pipelineFunnel) return []
    return data.admin.charts.pipelineFunnel
  }, [data])

  return (
    <ChartCard title="Where are we losing customers?" subtitle="Pipeline by stage" loading={loading} empty={chartData.length === 0}>
      {chartData.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
          {chartData.map((item: { stage: string; value: number }, i: number) => {
            const maxVal = Math.max(...chartData.map((s: { value: number }) => s.value), 1)
            const pct = (item.value / maxVal) * 100
            const drop = i > 0 ? Math.round((1 - item.value / Math.max(chartData[i - 1].value, 1)) * 100) : null
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 3 }}>
                  <span style={{ fontWeight: 500 }}>{item.stage}</span>
                  <span style={{ fontWeight: 700 }}>{item.value.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 10, background: 'var(--bg-tertiary)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: FROZEN[i % FROZEN.length], borderRadius: 5, transition: 'width 0.5s' }} />
                </div>
                {drop != null && drop > 0 && (
                  <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)', margin: '1px 0' }}>
                    {drop}% drop-off from {chartData[i - 1].stage}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}

function RevenueByRegionChart({ data, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const chartData = useMemo(() => {
    if (!data.admin?.geography) return []
    return data.admin.geography.slice(0, 8).map((g: Record<string, unknown>) => ({
      name: (g.city as string) || 'Unknown',
      value: Number(g.total_system_value ?? g.customer_count ?? 0),
    }))
  }, [data])

  return (
    <ChartCard title="Which region performs best?" subtitle="Top cities by value" loading={loading} empty={chartData.length === 0}>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} layout="vertical">
            <CartesianGrid {...grid} />
            <XAxis type="number" tick={tick} />
            <YAxis type="category" dataKey="name" tick={tick} width={70} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" fill="#ff8a1d" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

function ForecastChart({ data, loading }: { data: BISectionProps['data']; loading: boolean }) {
  const forecast = useMemo(() => {
    if (!data.admin?.charts?.forecasting) return null
    return data.admin.charts.forecasting as Record<string, unknown>
  }, [data])

  const items = [
    { label: 'Expected Monthly Revenue', key: 'expected_monthly_revenue', format: 'currency' },
    { label: 'Expected Customer Growth', key: 'expected_customer_growth', format: 'number' },
    { label: 'Expected Installed Capacity', key: 'expected_installed_capacity', format: 'kw' },
    { label: 'Projected Annual Revenue', key: 'projected_annual_revenue', format: 'currency' },
  ] as const

  return (
    <ChartCard title="What should we expect next?" subtitle="Forecast" loading={loading} empty={!forecast || Object.keys(forecast).length === 0}>
      {forecast && Object.keys(forecast).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
          {items.map(item => {
            const val = forecast[item.key] as number | undefined
            return (
              <div key={item.key} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-orange)' }}>
                  {val == null ? 'N/A' : item.format === 'currency'
                    ? `₹${(val / 100000).toFixed(1)}L`
                    : item.format === 'kw'
                      ? `${val.toFixed(1)} kW`
                      : val.toLocaleString('en-IN')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}

export default function BICharts({ data }: BISectionProps) {
  const loading = data.loading
  const hasData = data.admin !== null

  if (!loading && !hasData) return null

  return (
    <div className="card-grid-2">
      <RevenueTrendChart data={data} loading={loading} />
      <PipelineFunnelChart data={data} loading={loading} />
      <RevenueByRegionChart data={data} loading={loading} />
      <ForecastChart data={data} loading={loading} />
    </div>
  )
}
