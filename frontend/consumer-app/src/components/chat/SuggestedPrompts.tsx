import React from 'react'

interface SuggestedPromptsProps {
  prompts: string[]
  onSelect: (prompt: string) => void
  disabled: boolean
  theme?: 'blue' | 'purple'
}

export default function SuggestedPrompts({ prompts, onSelect, disabled, theme = 'blue' }: SuggestedPromptsProps) {
  const chipBg = theme === 'purple'
    ? 'rgba(124, 93, 250, 0.08)'
    : 'rgba(23, 168, 229, 0.08)'
  const chipBorder = theme === 'purple'
    ? '1px solid rgba(124, 93, 250, 0.25)'
    : '1px solid rgba(23, 168, 229, 0.25)'
  const chipColor = theme === 'purple'
    ? '#7c5dfa'
    : 'var(--accent-blue)'

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          aria-label={`Ask: ${prompt}`}
          style={{
            fontSize: '11px',
            background: chipBg,
            border: chipBorder,
            color: chipColor,
            padding: '6px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none',
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.target as HTMLElement).style.background = theme === 'purple' ? 'rgba(124,93,250,0.18)' : 'rgba(23,168,229,0.16)'
              ;(e.target as HTMLElement).style.borderColor = theme === 'purple' ? 'rgba(124,93,250,0.5)' : 'var(--accent-blue)'
              ;(e.target as HTMLElement).style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = chipBg
            ;(e.target as HTMLElement).style.borderColor = chipBorder
            ;(e.target as HTMLElement).style.transform = 'translateY(0)'
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
