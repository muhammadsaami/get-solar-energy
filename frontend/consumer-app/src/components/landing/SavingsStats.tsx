interface SavingsStatProps {
  value: string
  label: string
  valueColor?: string
}

function SavingsStat({ value, label, valueColor }: SavingsStatProps) {
  return (
    <div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: valueColor ?? 'var(--text-primary)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  )
}

export default function SavingsStats() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 40,
        marginBottom: 30,
      }}
    >
      <SavingsStat
        value={'\u20B94.2 Cr+'}
        label="Total Customer Savings"
      />
      <SavingsStat
        value="120 MW"
        label="Clean Energy Deployed"
        valueColor="var(--accent-green)"
      />
    </div>
  )
}
