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
      <div style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 600, marginTop: 2 }}>
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
        value="~90%"
        label="Typical Bill Reduction"
      />
      <SavingsStat
        value="25 Yrs"
        label="Guaranteed Power Generation"
        valueColor="var(--accent-green)"
      />
    </div>
  )
}
