import React, { useRef, useEffect } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled: boolean
  placeholder?: string
  sendLabel?: string
  theme?: 'blue' | 'purple'
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Ask GET Solar Advisor...',
  sendLabel = 'Send',
  theme = 'blue',
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const sendBtnStyle: React.CSSProperties = theme === 'purple'
    ? { marginTop: 0, padding: '10px 20px', width: 'auto', fontSize: '12px', fontWeight: 700, background: '#7c5dfa', borderColor: '#7c5dfa' }
    : { marginTop: 0, padding: '10px 20px', width: 'auto', fontSize: '12px', fontWeight: 700 }

  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? (theme === 'purple' ? 'Enterprise AI is thinking...' : 'GET Solar Copilot is thinking...') : placeholder}
        disabled={disabled}
        aria-label={placeholder}
        style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-navy)', outline: 'none', fontSize: '12px' }}
      />
      <button
        className="calc-btn"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label={sendLabel}
        style={sendBtnStyle}
      >
        {sendLabel}
      </button>
    </div>
  )
}
