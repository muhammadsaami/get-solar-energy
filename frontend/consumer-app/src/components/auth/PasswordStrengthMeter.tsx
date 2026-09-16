interface PasswordStrengthMeterProps {
  strength: 0 | 1 | 2 | 3 | 4
  visible: boolean
}

const levels = [
  { color: '', text: 'Strength' },
  { color: 'weak', text: 'Weak' },
  { color: 'fair', text: 'Fair' },
  { color: 'good', text: 'Good' },
  { color: 'strong', text: 'Strong' },
]

export default function PasswordStrengthMeter({ strength, visible }: PasswordStrengthMeterProps) {
  const level = levels[strength] || levels[0]
  const labelColor =
    strength === 4 ? 'var(--accent-green)' : strength >= 2 ? 'var(--accent-blue)' : 'var(--text-muted)'

  return (
    <div className="password-strength">
      <div className="strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`strength-bar${i < strength && visible ? ` ${level.color}` : ''}`}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: visible ? labelColor : undefined }}>
        {visible ? level.text : 'Strength'}
      </span>
    </div>
  )
}
