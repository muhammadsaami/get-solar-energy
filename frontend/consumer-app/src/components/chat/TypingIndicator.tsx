import React from 'react'

interface TypingIndicatorProps {
  theme: 'blue' | 'purple'
}

export default function TypingIndicator({ theme }: TypingIndicatorProps) {
  if (theme === 'purple') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '80%' }}>
        <div
          className="message-bubble"
          style={{ background: 'rgba(124,93,250,0.1)', border: '1px solid rgba(124,93,250,0.25)', padding: '10px 14px', borderRadius: '8px 8px 8px 0', fontSize: '12px', color: 'var(--text-navy)', lineHeight: '1.4', display: 'flex', gap: '4px', alignItems: 'center' }}
        >
          <span className="ent-pulse-dot" style={{ color: '#7c5dfa' }}>●</span>
          <span className="ent-pulse-dot" style={{ color: '#7c5dfa', animationDelay: '0.2s' }}>●</span>
          <span className="ent-pulse-dot" style={{ color: '#7c5dfa', animationDelay: '0.4s' }}>●</span>
          <span style={{ marginLeft: '4px', color: 'var(--text-muted)' }}>Thinking...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="chat-message assistant"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '80%', marginTop: '8px' }}
    >
      <div
        className="message-bubble"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px 8px 8px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', display: 'flex', gap: '4px', alignItems: 'center' }}
      >
        <span>GET Solar Copilot is thinking</span>
        <span className="chat-pulse-dot" style={{ animationDelay: '0s' }}>.</span>
        <span className="chat-pulse-dot" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="chat-pulse-dot" style={{ animationDelay: '0.4s' }}>.</span>
      </div>
    </div>
  )
}
