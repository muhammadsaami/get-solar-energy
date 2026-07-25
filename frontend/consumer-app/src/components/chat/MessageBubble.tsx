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

  return (
    <div
      className={`chat-message ${isUser ? 'user' : 'assistant'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginLeft: isUser ? 'auto' : undefined,
        position: 'relative',
      }}
    >
      <div
        className="message-bubble"
        style={
          isUser
            ? { background: userBg, border: userBorder, padding: '10px 14px', borderRadius: '8px 8px 0 8px', fontSize: '12px', color: 'var(--text-navy)', lineHeight: '1.4', textAlign: 'left' }
            : { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px 8px 8px 0', fontSize: '12px', color: 'var(--text-navy)', lineHeight: '1.4', textAlign: 'left' }
        }
      >
        <MarkdownRenderer content={message.content} />
      </div>
      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: isUser ? undefined : '4px', marginRight: isUser ? '4px' : undefined }}>{message.time}</span>
      {!isUser && <CopyButton content={message.content} />}
    </div>
  )
}
