import React, { useRef, useEffect } from 'react'
import type { ChatMessage, RawDiagnosisPayload } from '../types/technicianAi.types'
import { MdChevronRight } from 'react-icons/md'

interface ConversationPanelProps {
  messages: ChatMessage[]
  sending?: boolean
  onSelectDiagnosis: (diag: RawDiagnosisPayload) => void
}

export default function ConversationPanel({
  messages,
  sending,
  onSelectDiagnosis,
}: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  return (
    <div className="ai-chat-messages" ref={scrollRef}>
      {messages.map(msg => (
        <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
          <div>{msg.text}</div>

          {msg.diagnosis && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => onSelectDiagnosis(msg.diagnosis!)}
              >
                <span>Inspect Step-by-Step Resolution Guide</span>
                <MdChevronRight />
              </button>
            </div>
          )}

          <div className="chat-bubble-meta">
            <span>{msg.sender === 'user' ? 'Technician' : 'GET Solar AI'}</span>
            <span>{msg.timestamp}</span>
          </div>
        </div>
      ))}

      {sending && (
        <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00aeef', animation: 'pulse 1s infinite' }} />
          <span>Analyzing fault parameters & standard operating procedures...</span>
        </div>
      )}
    </div>
  )
}
