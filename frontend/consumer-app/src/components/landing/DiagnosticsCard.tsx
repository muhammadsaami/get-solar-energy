interface DiagnosticsCardProps {
  value: string
  label: string
}

export default function DiagnosticsCard({ value, label }: DiagnosticsCardProps) {
  return (
    <div className="qa-hud-card">
      <span className="hud-check">{'\u2713'}</span>
      <div className="hud-info">
        <span className="hud-value">{value}</span>
        <span className="hud-label">{label}</span>
      </div>
    </div>
  )
}
