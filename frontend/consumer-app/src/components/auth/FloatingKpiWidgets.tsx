interface KpiData {
  icon: string
  value: string
  label: string
  positionClass: string
  floatClass: string
}

const defaultKpis: KpiData[] = [
  { icon: '\u{1F3C6}', value: '92%', label: 'Solar Readiness', positionClass: 'kpi-top-left', floatClass: 'float-a' },
  { icon: '\u26A1', value: '5.2 kW', label: 'Recommended System', positionClass: 'kpi-top-right', floatClass: 'float-b' },
  { icon: '\u{1F4B0}', value: '\u20B958,400', label: 'Annual Savings', positionClass: 'kpi-bottom-left', floatClass: 'float-c' },
  { icon: '\u{1F4C8}', value: '3.8 Years', label: 'Payback', positionClass: 'kpi-bottom-right', floatClass: 'float-d' },
]

interface FloatingKpiWidgetsProps {
  kpis?: KpiData[]
}

export default function FloatingKpiWidgets({ kpis = defaultKpis }: FloatingKpiWidgetsProps) {
  return (
    <>
      {kpis.map((kpi) => (
        <div
          key={kpi.positionClass}
          className={`floating-kpi ${kpi.positionClass} ${kpi.floatClass}`}
          aria-hidden="true"
        >
          <div className="fkpi-icon">{kpi.icon}</div>
          <div className="fkpi-body">
            <span className="fkpi-value">{kpi.value}</span>
            <span className="fkpi-label">{kpi.label}</span>
          </div>
        </div>
      ))}
    </>
  )
}
