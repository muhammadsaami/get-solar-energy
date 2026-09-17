import DiagnosticsCard from './DiagnosticsCard'

const ITEMS = [
  { value: '99.9%', label: 'Verified System Reliability' },
  { value: 'Tier 1', label: 'Certified Components' },
  { value: '25 Years', label: 'Performance Warranty' },
  { value: 'Multi-Point', label: 'Rooftop Inspection' },
]

export default function DiagnosticsGrid() {
  return (
    <div className="qa-diagnostics-grid">
      {ITEMS.map((item) => (
        <DiagnosticsCard
          key={item.label}
          value={item.value}
          label={item.label}
        />
      ))}
    </div>
  )
}
