import React, { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import type { ChatMessage } from '../../types/chat'

interface MessageListProps {
  messages: ChatMessage[]
  isTyping: boolean
  typingTheme: 'blue' | 'purple'
  height?: string
}

function isNearBottom(el: HTMLElement): boolean {
  const threshold = 60
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

export default function MessageList({ messages, isTyping, typingTheme, height = '280px' }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    if (messages.length > prevLengthRef.current && isNearBottom(el)) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
    prevLengthRef.current = messages.length
  }, [messages])

  useEffect(() => {
    const el = listRef.current
    if (!el || !isTyping) return
    if (isNearBottom(el)) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [isTyping])

  return (
    <div
      className="chat-conversation-log"
      ref={listRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      style={{ height, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '12px' }}
    >
      {messages.map((msg, i) => (
        <MessageBubble key={`${i}-${msg.time}`} message={msg} theme={msg.role === 'user' ? 'blue' : typingTheme} />
      ))}
      {isTyping && <TypingIndicator theme={typingTheme} />}
    </div>
  )
}
