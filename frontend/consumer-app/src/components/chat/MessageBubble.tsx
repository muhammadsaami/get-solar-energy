import React from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import CopyButton from './CopyButton'
import type { ChatMessage } from '../../types/chat'

interface MessageBubbleProps {
  message: ChatMessage
  theme: 'blue' | 'purple'
}

export default function MessageBubble({ message, theme }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const userBg = theme === 'purple'
    ? 'rgba(124, 93, 250, 0.15)'
    : 'rgba(0, 174, 239, 0.15)'
  const userBorder = theme === 'purple'
    ? '1px solid rgba(124, 93, 250, 0.3)'
    : '1px solid rgba(0, 174, 239, 0.3)'

  const contextLabel = message.contextUsed
    ? `AI-generated guidance · ${message.contextUsed}`
    : 'AI-generated guidance · General AI guidance'

  return (
    <div
      className={`chat-message ${isUser ? 'user' : 'assistant'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginLeft: isUser ? 'auto' : undefined,
        position: 'relative',
      }}
    >
      <div
        className="message-bubble"
        style={
          isUser
            ? { background: userBg, border: userBorder, padding: '10px 14px', borderRadius: '8px 8px 0 8px', fontSize: '12px', color: 'var(--text-navy)', lineHeight: '1.4', textAlign: 'left', wordBreak: 'break-word' }
            : {
                background: message.isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                border: message.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                padding: '10px 14px',
                borderRadius: '8px 8px 8px 0',
                fontSize: '12px',
                color: 'var(--text-navy)',
                lineHeight: '1.4',
                textAlign: 'left',
                wordBreak: 'break-word',
              }
        }
      >
        <MarkdownRenderer content={message.content} />

        {/* Render genuine sources ONLY if provided by backend (future-ready) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div
            className="chat-sources-list"
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color-light)',
              fontSize: '11px',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Sources:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {message.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--accent-blue)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🔗 {src.title || src.domain || 'Source'}</span>
                  {src.domain && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({src.domain})</span>}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: '4px',
          marginLeft: isUser ? undefined : '4px',
          marginRight: isUser ? '4px' : undefined,
        }}
      >
        {!isUser && <span>{contextLabel}</span>}
        {!isUser && <span>·</span>}
        <span>{message.time}</span>
      </div>

      {!isUser && !message.isError && <CopyButton content={message.content} />}
    </div>
  )
}
