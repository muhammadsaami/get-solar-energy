interface SuitabilityCardProps {
  icon: string
  label: string
  value: string
}

export default function SuitabilityCard({ icon, label, value }: SuitabilityCardProps) {
  return (
    <div className="insight-card">
      <div className="insight-icon">{icon}</div>
      <div className="insight-content">
        <span className="insight-label">{label}</span>
        <span className="insight-value">{value}</span>
      </div>
    </div>
  )
}
