import React, { useState } from 'react'
import { useEnterpriseAI } from '../hooks/useEnterpriseAI'
import { ENTERPRISE_AI_PROMPTS } from '../config/enterpriseAIPrompts'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import SuggestedPrompts from '../components/chat/SuggestedPrompts'
import ClearConversationButton from '../components/chat/ClearConversationButton'
import EnterpriseSidebar from '../components/chat/EnterpriseSidebar'

const CAPABILITIES = [
  { label: 'CRM Orchestration', status: 'Active' },
  { label: 'Customer 360',      status: 'Active' },
  { label: 'AI Analysis',       status: 'Active' },
  { label: 'Recommendations',   status: 'Active' },
  { label: 'Report Generation',  status: 'Active' },
]

export default function EnterpriseAI() {
  const {
    messages,
    isTyping,
    timeline,
    toolResults,
    contextInfo,
    sendMessage,
    clearConversation,
  } = useEnterpriseAI()
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  function handlePromptSelect(prompt: string) {
    sendMessage(prompt)
  }

  return (
    <div className="ew-page" role="tabpanel" aria-label="enterprise ai">
      {/* ── Mission Control Header ── */}
      <header className="ew-mission-bar" role="banner" aria-label="Enterprise AI Command Bar">
        <div className="ew-mission-scope">
          <span className="ew-live-dot" />
          <span className="ew-scope-badge">AI / COPILOT-ENGINE</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Solar Copilot &amp; Tool Orchestration</span>
        </div>

        <div className="ew-mission-stats">
          <div className="ew-mission-stat-item">
            <span>Model Status:</span>
            <strong style={{ color: 'var(--color-green)' }}>ONLINE (18 tools)</strong>
          </div>
          <div className="ew-mission-stat-item">
            <span>Messages:</span>
            <strong style={{ color: 'var(--color-cyan)' }}>{messages.length}</strong>
          </div>
        </div>
      </header>

      {/* ── Status Capability Strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(23,168,229,0.06)',
          border: '1px solid rgba(23,168,229,0.18)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span className="ew-live-dot" style={{ marginRight: 6, display: 'inline-block' }} /> Capabilities:
        </span>
        {CAPABILITIES.map(cap => (
          <span
            key={cap.label}
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '4px',
              padding: '2px 8px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {cap.label} <em style={{ color: 'var(--color-green)', fontStyle: 'normal' }}>· {cap.status}</em>
          </span>
        ))}
      </div>

      {/* ── Main Chat & Context Asymmetric Grid ── */}
      <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1fr 340px' }}>
        <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: 'var(--space-4)' } as React.CSSProperties}>
          <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '18px', height: '18px', stroke: 'var(--color-cyan)', fill: 'none', strokeWidth: '2' }} viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="15" x2="8" y2="17" />
                <line x1="16" y1="15" x2="16" y2="17" />
              </svg>
              <span className="kpi-title">Solar Intelligence Copilot</span>
              <span className="ew-section-chip blue" style={{ marginLeft: 'auto' }}>
                {messages.length} exchanges
              </span>
            </div>
          </div>

          <MessageList
            messages={messages}
            isTyping={isTyping}
            typingTheme="blue"
            height="340px"
          />

          <SuggestedPrompts
            prompts={ENTERPRISE_AI_PROMPTS}
            onSelect={handlePromptSelect}
            disabled={isTyping}
            theme="blue"
          />

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isTyping}
            placeholder="Ask Enterprise Copilot about leads, CRM, site surveys, or generation..."
            sendLabel="Dispatch"
            theme="blue"
          />

          <ClearConversationButton onClear={clearConversation} disabled={isTyping} />
        </div>

        {/* Right contextual inspector */}
        <EnterpriseSidebar
          timeline={timeline}
          toolResults={toolResults}
          context={contextInfo}
        />
      </div>
    </div>
  )
}
