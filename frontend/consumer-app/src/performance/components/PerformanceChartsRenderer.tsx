import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts'
import type { ChartConfig } from '../config/performanceCharts'
import type { PerformanceChartPoint, PerformanceChartDataset } from '../types/performance.types'

const grid = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' }
const tick = { fontSize: 10, fill: 'var(--text-muted)' }
const tooltipStyle: React.CSSProperties = {
  background: 'var(--bg-tooltip)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  fontSize: '11px',
}

const COLOR_MAP: Record<string, string> = {
  'var(--chart-1)': '#17a8e5',
  'var(--chart-2)': '#ff8a1d',
  'var(--chart-3)': '#36d399',
  'var(--chart-4)': '#7c5dfa',
  'var(--chart-5)': '#f43f5e',
  'var(--chart-6)': '#fbbf24',
  'var(--chart-7)': '#06b6d4',
  'var(--chart-8)': '#ec4899',
  'var(--chart-9)': '#84cc16',
  'var(--chart-10)': '#f97316',
}

function hex(cssVar: string): string {
  return COLOR_MAP[cssVar] || cssVar
}

function isDatasetData(d: PerformanceChartPoint[] | PerformanceChartDataset[]): d is PerformanceChartDataset[] {
  return d.length > 0 && 'label' in d[0]
}

function mergeDatasets(datasets: PerformanceChartDataset[]): Record<string, string | number>[] {
  if (!datasets.length) return []
  return datasets[0].data.map((point, i) => {
    const row: Record<string, string | number> = { month: point.month }
    for (const ds of datasets) {
      row[ds.label] = ds.data[i]?.value ?? 0
    }
    return row
  })
}

interface ChartTooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayloadItem[]
  label?: string | number
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ fontSize: 10, color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </div>
      ))}
    </div>
  )
}

function renderBarChart(points: PerformanceChartPoint[], color: string) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={points} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function renderAreaChart(points: PerformanceChartPoint[], color: string) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function renderLineChart(points: PerformanceChartPoint[], color: string, minDomain?: number) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} domain={minDomain ? [minDomain, 'auto'] : undefined} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function renderMultiLineChart(datasets: PerformanceChartDataset[]) {
  const merged = mergeDatasets(datasets)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={merged} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        {datasets.map((ds) => (
          <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={hex(ds.color)} strokeWidth={2} dot={{ r: 3 }} name={ds.label} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function renderStackedBarChart(datasets: PerformanceChartDataset[]) {
  const merged = mergeDatasets(datasets)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={merged} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        {datasets.map((ds) => (
          <Bar key={ds.label} dataKey={ds.label} fill={hex(ds.color)} radius={[4, 4, 0, 0]} name={ds.label} stackId="stack" />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function PerformanceChartsRenderer({
  chartConfig,
  data,
}: {
  chartConfig: ChartConfig
  data: PerformanceChartPoint[] | PerformanceChartDataset[] | null
}) {
  if (!data || (Array.isArray(data) && data.length === 0)) return null

  const color = hex(chartConfig.colorToken)

  switch (chartConfig.chartType) {
    case 'bar':
      return renderBarChart(data as PerformanceChartPoint[], color)

    case 'area':
      return renderAreaChart(data as PerformanceChartPoint[], color)

    case 'line':
      if (isDatasetData(data)) {
        return renderMultiLineChart(data)
      }
      return renderLineChart(
        data as PerformanceChartPoint[],
        color,
        chartConfig.id === 'pr-ratio' ? 75 : undefined,
      )

    case 'stacked-bar':
      return renderStackedBarChart(data as PerformanceChartDataset[])

    default:
      return null
  }
}
