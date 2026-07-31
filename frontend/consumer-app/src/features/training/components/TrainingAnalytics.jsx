import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const CHART_COLORS = ['var(--accent-blue)', 'var(--accent-orange)', 'var(--accent-green)', '#a855f7', '#f59e0b', '#06b6d4']

const MOCK_MONTHLY_HOURS = [
  { month: 'Feb', hours: 18 },
  { month: 'Mar', hours: 24 },
  { month: 'Apr', hours: 32 },
  { month: 'May', hours: 28 },
  { month: 'Jun', hours: 36 },
  { month: 'Jul', hours: 42 },
]

const MOCK_COMPLETION_TREND = [
  { month: 'Feb', rate: 45 },
  { month: 'Mar', rate: 55 },
  { month: 'Apr', rate: 60 },
  { month: 'May', rate: 68 },
  { month: 'Jun', rate: 75 },
  { month: 'Jul', rate: 82 },
]

const MOCK_SKILL_DISTRIBUTION = [
  { skill: 'Installation', percentage: 65 },
  { skill: 'Safety', percentage: 90 },
  { skill: 'Electrical', percentage: 70 },
  { skill: 'Design', percentage: 45 },
  { skill: 'Customer Service', percentage: 55 },
  { skill: 'Compliance', percentage: 60 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8,24,42,0.97)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--text-primary)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'hours' ? 'h' : p.name === 'rate' ? '%' : ''}</div>
      ))}
    </div>
  )
}

export default function TrainingAnalytics({ analytics }) {
  if (!analytics) return null

  const monthlyHours = analytics.monthlyHours?.length ? analytics.monthlyHours : MOCK_MONTHLY_HOURS
  const completionTrend = analytics.completionTrend?.length ? analytics.completionTrend : MOCK_COMPLETION_TREND
  const skillDistribution = analytics.skillDistribution?.length ? analytics.skillDistribution : MOCK_SKILL_DISTRIBUTION

  return (
    <>
      <div className="card-base chart-fullwidth-card" style={{ marginTop: 20, '--card-theme': '23, 168, 229' }}>
        <div className="kpi-header-row">
          <span className="kpi-title">Monthly Learning Hours</span>
          <svg className="kpi-title-icon blue"><use href="#icon-trending" /></svg>
        </div>
        <div style={{ height: 220, position: 'relative', padding: '8px 0' }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyHours}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="tab-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' }}>
          <div className="kpi-header-row" style={{ marginBottom: 8 }}>
            <span className="kpi-title">Course Completion Rate</span>
            <svg className="kpi-title-icon green"><use href="#icon-clipboard-check" /></svg>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={completionTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" stroke="var(--accent-green)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent-green)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' }}>
          <div className="kpi-header-row" style={{ marginBottom: 8 }}>
            <span className="kpi-title">Skill Distribution</span>
            <svg className="kpi-title-icon orange"><use href="#icon-activity" /></svg>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={skillDistribution} dataKey="percentage" nameKey="skill" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {skillDistribution.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              display: 'flex', flexWrap: 'wrap', gap: '4px 10px', justifyContent: 'center', fontSize: 8,
            }}>
              {skillDistribution.map((s, idx) => (
                <span key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length], display: 'inline-block' }} />
                  {s.skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
